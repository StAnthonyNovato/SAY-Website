# Copyright (c) 2025 Damien Boisvert (AlphaGameDeveloper)
# 
# This software is released under the MIT License.
# https://opensource.org/licenses/MIT

module Jekyll
    class EnsureJekyllEnvironment < Generator
        priority :highest
        safe true

        def generate(site)
        # Ensure that the Jekyll environment is set to 'production' for deployment
        if ENV['JEKYLL_ENV'].nil? || (ENV['JEKYLL_ENV'] != 'production' && ENV['JEKYLL_ENV'] != "development")
            Jekyll.logger.warn "EnsureJekyllEnv", "Environment variable JEKYLL_ENV is none or not production."
            Jekyll.logger.warn "EnsureJekyllEnv", "Setting it to 'development', as a safe fallback :)"
            ENV['JEKYLL_ENV'] = 'development'
        end

        # set site.environment
        site.config['environment'] = ENV['JEKYLL_ENV']

        Jekyll.logger.info "EnsureJekyllEnv", "Jekyll environment set to: #{ENV['JEKYLL_ENV']}"
        end
    end
    end