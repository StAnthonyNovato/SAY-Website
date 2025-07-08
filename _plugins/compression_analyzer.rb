require 'fileutils'
require 'json'

# HTML Compression Analyzer Plugin for Jekyll
# 
# This plugin runs before HTML minification and analyzes the potential compression
# savings for all HTML files in the site. It provides detailed statistics including:
# 
# - Individual file compression percentages
# - Total and average compression ratios
# - Files with the highest compression potential
# - Historical logging of compression statistics
#
# The plugin uses a conservative minification algorithm to estimate compression
# without actually modifying the files, allowing it to run before the real
# minification process (like jekyll-minifier).
#
# Output:
# - Console report during build showing compression analysis
# - _compression_analysis.log: Historical log of compression statistics
#
# Usage: Simply place this file in your _plugins/ directory
# 
# Author: Generated for Jekyll site compression analysis
# Priority: :lowest (runs last before minification)

module Jekyll
  class PreMinificationLogger < Generator
    priority :lowest  # Run last, just before minification
    
    def generate(site)
      @site = site
      @compression_data = []
      
      # Hook into post_write to capture files after generation but before minification
      Jekyll::Hooks.register :site, :post_write do |hook_site|
        measure_html_files(hook_site) if hook_site == site
      end
    end
    
    private
    
    def measure_html_files(site)
      html_files = Dir.glob(File.join(site.dest, "**", "*.html"))
      return if html_files.empty?
      

      total_original = 0
      total_estimated_compressed = 0
      files_analyzed = 0
      
      html_files.each do |file_path|
        next unless File.exist?(file_path)
        
        begin
          original_content = File.read(file_path, encoding: 'UTF-8')
        rescue Encoding::InvalidByteSequenceError, Encoding::UndefinedConversionError
          # Try reading as binary and then convert to UTF-8
          original_content = File.read(file_path, encoding: 'BINARY').force_encoding('UTF-8')
          original_content = original_content.scrub('?') unless original_content.valid_encoding?
        end
        
        original_size = original_content.bytesize
        
        # Estimate compressed size using our minification algorithm
        estimated_compressed = estimate_minified_size(original_content)
        estimated_size = estimated_compressed.bytesize
        
        # Calculate potential savings
        potential_savings = original_size - estimated_size
        percentage_saved = original_size > 0 ? (potential_savings.to_f / original_size * 100).round(1) : 0
        
        # Track totals
        total_original += original_size
        total_estimated_compressed += estimated_size
        files_analyzed += 1
        
        # Store data for summary
        relative_path = file_path.sub(site.dest + "/", "")
        @compression_data << {
          path: relative_path,
          original: original_size,
          compressed: estimated_size,
          savings: potential_savings,
          percentage: percentage_saved
        }
      end
      
      # Display results
      display_compression_results(files_analyzed, total_original, total_estimated_compressed)
      
      # Generate only the JSON files needed for the dashboard
      generate_dashboard_data(files_analyzed, total_original, total_estimated_compressed)
    end
    
    def estimate_minified_size(content)
      # Ensure content is treated as UTF-8 and handle encoding issues
      begin
        minified = content.dup.force_encoding('UTF-8')
        
        # If the content has invalid UTF-8 sequences, try to scrub them
        unless minified.valid_encoding?
          minified = minified.scrub('?')
        end
        
        # Remove HTML comments (preserve IE conditionals)
        minified.gsub!(/<!--(?!\s*(?:\[if|\]>|<!)).*?-->/m, '')
        
        # Remove extra whitespace between tags
        minified.gsub!(/>\s+</, '><')
        
        # Remove leading/trailing whitespace
        minified.gsub!(/^\s+|\s+$/m, '')
        
        # Collapse multiple spaces/tabs/newlines into single space
        minified.gsub!(/\s+/, ' ')
        
        # Remove space around block elements
        minified.gsub!(/\s*(<\/?(?:div|p|h[1-6]|article|section|nav|header|footer|main|ul|ol|li|table|tr|td|th|tbody|thead|tfoot)[^>]*>)\s*/i, '\1')
        
        # Remove quotes around single-word attributes
        minified.gsub!(/(\w+)="(\w+)"/, '\1=\2')
        
        # Remove optional closing tags (be conservative)
        # minified.gsub!(/<\/(?:li|p|dt|dd|option|thead|tbody|tfoot|tr|td|th)>/i, '')
        
        minified.strip
      rescue ArgumentError => e
        # If encoding issues persist, return the original content
        Jekyll.logger.warn "Compression Analyzer", "Encoding error for content: #{e.message}"
        content
      end
    end
    
    def display_compression_results(file_count, total_original, total_compressed)
      total_savings = total_original - total_compressed
      overall_percentage = total_original > 0 ? (total_savings.to_f / total_original * 100).round(1) : 0
      
      # Show files with significant compression potential
      significant_files = @compression_data
        .select { |data| data[:percentage] >= 15 }
        .sort_by { |data| -data[:percentage] }
        .first(8)
      
      avg_original = file_count > 0 ? total_original / file_count : 0
      avg_compressed = file_count > 0 ? total_compressed / file_count : 0
      avg_percentage = file_count > 0 ? @compression_data.sum { |d| d[:percentage] } / file_count : 0
    end
    
    def generate_dashboard_data(file_count, total_original, total_compressed)
      total_savings = total_original - total_compressed
      percentage = total_original > 0 ? (total_savings.to_f / total_original * 100).round(1) : 0
      timestamp = Time.now.strftime("%Y-%m-%d %H:%M:%S")
      
      # Create current compression data for dashboard
      compression_stats = {
        'file_count' => file_count,
        'total_original' => total_original,
        'total_compressed' => total_compressed,
        'total_savings' => total_savings,
        'percentage' => percentage,
        'bytes_saved' => format_bytes(total_savings),
        'last_updated' => timestamp,
        'files' => @compression_data.map do |data|
          {
            'name' => data[:path],
            'original_size' => data[:original],
            'compressed_size' => data[:compressed],
            'savings_bytes' => data[:savings],
            'percentage' => data[:percentage],
            'original_formatted' => format_bytes(data[:original]),
            'compressed_formatted' => format_bytes(data[:compressed]),
            'savings_formatted' => format_bytes(data[:savings])
          }
        end
      }
      
      # Generate JSON data for JavaScript consumption
      json_file = File.join(@site.dest, 'compression_data.json')
      File.open(json_file, 'w') do |f|
        f.write(JSON.pretty_generate(compression_stats))
      end
      
      # Generate or update historical data JSON
      generate_historical_data_json(timestamp, file_count, total_original, total_compressed, total_savings, percentage)
      
      Jekyll.logger.info "CompressionAnalyzer", "Compression analysis complete!"
    end
    
    def generate_historical_data_json(timestamp, file_count, total_original, total_compressed, total_savings, percentage)
      history_file = File.join(@site.dest, 'compression_history.json')
      
      # Load existing history if it exists (could be from GitHub Actions artifact)
      historical_data = []
      if File.exist?(history_file)
        begin
          existing_data = JSON.parse(File.read(history_file))
          historical_data = existing_data['history'] || []
        rescue JSON::ParserError
          # If file is corrupted, start fresh
          historical_data = []
        end
      end
      
      # Add current entry
      current_entry = {
        'timestamp' => timestamp,
        'files' => file_count,
        'original' => format_bytes(total_original),
        'compressed' => format_bytes(total_compressed),
        'saved' => format_bytes(total_savings),
        'percentage' => percentage
      }
      
      # Avoid duplicate entries (same timestamp to the minute)
      recent_timestamp = timestamp[0..15] # YYYY-MM-DD HH:MM
      unless historical_data.any? { |entry| entry['timestamp'][0..15] == recent_timestamp }
        historical_data << current_entry
      end
      
      # Keep only last 100 entries to prevent file from growing too large
      historical_data = historical_data.last(100)
      
      # Write historical data JSON
      File.open(history_file, 'w') do |f|
        f.write(JSON.pretty_generate({
          'history' => historical_data,
          'total_builds' => historical_data.length
        }))
      end
    end
    
    def format_bytes(bytes)
      return "0B" if bytes == 0
      
      if bytes < 1024
        "#{bytes}B"
      elsif bytes < 1024 * 1024
        "#{(bytes / 1024.0).round(1)}KB"
      else
        "#{(bytes / (1024.0 * 1024)).round(1)}MB"
      end
    end
    
    def update_historical_data(historical_data, current_entry)
      # Add the current entry to historical data
      historical_data << current_entry
      
      # Keep only last 100 entries to prevent file from growing too large
      historical_data = historical_data.last(100)
      
      puts "📈 Historical trends updated (#{historical_data.length} builds tracked)"
      historical_data
    end
  end
end
