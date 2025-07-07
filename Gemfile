source "https://rubygems.org"

gem "jekyll", "~> 4.4.1"  
gem "logger", "~> 1.5.3"  # Explicitly add logger to prevent future Ruby 3.5.0 warnings
gem "benchmark" # Explicitly add benchmark to prevent future Ruby 3.5.0 warnings
gem "ostruct"

gem "uglifier" # Used by jekyll-assets for minification

group :jekyll_plugins do
  gem "jekyll-feed", "~> 0.12"
  gem "jekyll-dotenv"
  gem "jekyll-sitemap"
  gem 'jekyll-news-sitemap'
  gem 'jekyll-paginate', '~> 1.1'
  gem 'jekyll-sass-converter', '~> 3.0'
  gem 'jekyll-minifier'
  # goddammit, this cannot work because of no version solving is availiable.
  # gem 'github-pages'
end

# Windows and JRuby does not include zoneinfo files, so bundle the tzinfo-data gem
# and associated library.
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end

gem "wdm", "~> 0.1", :platforms => [:mingw, :x64_mingw, :mswin]
gem "http_parser.rb", "~> 0.6.0", :platforms => [:jruby]
