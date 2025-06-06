module Jekyll
  class NewsIndexPage < Page
    def initialize(site, base, dir, type, value, posts)
      @site = site
      @base = base
      @dir  = dir
      @name = "index.html"

      self.process(@name)
      self.read_yaml(File.join(base, "_layouts"), "news_index.html")
      self.data["type"] = type
      self.data["value"] = value
      self.data["posts"] = posts
      self.data["ministry"] = value
      if type.capitalize == "Tag"
        self.data["title"] = "Tag: #{value}"
      else
        self.data["title"] = "#{type.capitalize}: #{site.data['ministries_metadata'][value]['name'] || value}"
      end
      
      end
  end

  class NewsIndexGenerator < Generator
    safe true

    def generate(site)
      Jekyll.logger.info "NewsIndexGenerator", "Starting index generation..."

      tag_map = Hash.new { |h, k| h[k] = [] }
      ministry_map = Hash.new { |h, k| h[k] = [] }

      site.posts.docs.each do |post|
        post_title = post.data["title"] || post.basename

        # Tags
        Array(post.data["tags"]).each do |tag|
          tag_map[tag] << post
          Jekyll.logger.debug "NewsIndexGenerator", "Added post '#{post_title}' to tag '#{tag}'"
        end

        # Ministry
        if post.data["ministry"]
          ministry = post.data["ministry"]
          ministry_map[ministry] << post
          Jekyll.logger.debug "NewsIndexGenerator", "Added post '#{post_title}' to ministry '#{ministry}'"
        end
      end

      # Store global tag + ministry lists
      site.data["tags"] = tag_map.keys.sort
      site.data["ministries"] = ministry_map.keys.sort

      Jekyll.logger.info "NewsIndexGenerator", "Exposed #{site.data['tags'].size} tags and #{site.data['ministries'].size} ministries to site.data"

      # Generate tag pages
      tag_map.each do |tag, posts|
        dir = File.join("news", "tag", tag)
        site.pages << NewsIndexPage.new(site, site.source, dir, "tag", tag, posts)
        Jekyll.logger.info "NewsIndexGenerator", "Created /#{dir} with #{posts.size} post(s)"
      end

      # Generate ministry pages
      ministry_map.each do |ministry, posts|
        dir = File.join("news", "ministry", ministry)
        site.pages << NewsIndexPage.new(site, site.source, dir, "ministry", ministry, posts)
        Jekyll.logger.info "NewsIndexGenerator", "Created /#{dir} with #{posts.size} post(s)"
      end

      Jekyll.logger.info "NewsIndexGenerator", "Finished index generation!"
    end
  end
end
