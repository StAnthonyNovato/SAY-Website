# Override the CACHE_DIR constant and resize method in jekyll-resize plugin
# This changes the default cache/resize/ directory to assets/images/resized/
# and fixes baseurl duplication issues in production
# 
# Note: If you want to ignore the resized images from git, add this to .gitignore:
# assets/images/resized/
#
Jekyll::Hooks.register :site, :after_init do |site|
  if defined?(Jekyll::Resize)
    # Remove the existing constant and set a new one
    Jekyll::Resize.send(:remove_const, :CACHE_DIR) if Jekyll::Resize.const_defined?(:CACHE_DIR)
    Jekyll::Resize.const_set(:CACHE_DIR, "assets/images/resized/")
    
    # Override the resize method to fix baseurl handling
    Jekyll::Resize.module_eval do
      def resize(source, options)
        raise "`source` must be a string - got: #{source.class}" unless source.is_a? String
        raise "`source` may not be empty" unless source.length > 0
        raise "`options` must be a string - got: #{options.class}" unless options.is_a? String
        raise "`options` may not be empty" unless options.length > 0

        site = @context.registers[:site]

        src_path, dest_path, dest_dir, dest_filename, dest_path_rel = _paths(site.source, source, options)

        FileUtils.mkdir_p(dest_dir)

        if _must_create?(src_path, dest_path)
          puts "Resizing '#{source}' to '#{dest_path_rel}' - using options: '#{options}'"

          _process_img(src_path, options, dest_path)

          site.static_files << Jekyll::StaticFile.new(site, site.source, Jekyll::Resize::CACHE_DIR, dest_filename)
        end

        # Return just the relative path without baseurl - Jekyll will handle baseurl automatically
        "/#{dest_path_rel}"
      end
    end
    
    puts "Modified jekyll-resize CACHE_DIR to: assets/images/resized/ and fixed baseurl handling"
  end
end
