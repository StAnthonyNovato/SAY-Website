# Instruction File for Writing Jekyll Plugins
This file contains instructions for the AI to assist with the development and maintenance of Jekyll plugins, specifically focusing on the codebase and functionality of the plugins.

1. **Location** Put them in the `_plugins` directory of the Jekyll site.
2. **File Naming** Use descriptive names for plugin files, such as `my_plugin.rb` or `email_subscription.rb`.
3. **Plugin Structure** Each plugin should define a class that inherits from `Jekyll::Plugin` or `Jekyll::Generator`.
4. **Functionality** Ensure that the plugin provides specific functionality, such as generating content, modifying site data, or adding custom tags or filters.
5. **Documentation** Include comments and documentation within the plugin code to explain its purpose, usage, and any configuration options.
6. **Logging** Use Jekyll's built-in logging capabilities to log important events or errors within the plugin.
    * Try having one INFO statement at the start of the plugin to indicate it has been loaded.
    * Other than that, use DEBUG; except for errors, or warnings, which should use WARN or ERROR respectively.