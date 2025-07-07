# Override the CACHE_DIR constant in jekyll-resize plugin
# This changes the default cache/resize/ directory to assets/images/resized/
# 
# Note: If you want to ignore the resized images from git, add this to .gitignore:
# assets/images/resized/
#
Jekyll::Hooks.register :site, :after_init do |site|
  if defined?(Jekyll::Resize)
    # Remove the existing constant and set a new one
    Jekyll::Resize.send(:remove_const, :CACHE_DIR) if Jekyll::Resize.const_defined?(:CACHE_DIR)
    Jekyll::Resize.const_set(:CACHE_DIR, "assets/images/resized/")
    puts "Modified jekyll-resize CACHE_DIR to: assets/images/resized/"
  end
end
