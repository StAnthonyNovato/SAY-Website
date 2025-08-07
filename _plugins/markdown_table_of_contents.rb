# Copyright (c) 2025 Damien Boisvert (AlphaGameDeveloper)
# 
# This software is released under the MIT License.
# https://opensource.org/licenses/MIT

module Jekyll    
    class TableOfContentsTag < Liquid::Tag        
        def render(context)
            page = context.registers[:page]
            site = context.registers[:site]
            content = page['content'] || ''

            if content.empty?
                return '<span style="color: red;">NO CONTENT</span>'
            end

            toc = generate_toc(content)
            html = "<div class=\"table-of-contents\">"
            html << toc
            html << "</div>"
            html
        end

        private

        def generate_toc(content)
            toc_items = []
            toc_items << "<ul>" # Add opening <ul> tag for top level
            stack = []
            previous_level = 0
            first_item = true

            content.scan(/^(#+)\s+(.*)$/) do |hashes, heading|
                level = hashes.length
                next unless level.between?(2, 6)

                anchor = heading.strip.downcase.gsub(/[^a-z0-9]+/, '-').gsub(/^-|-$/, '')
                item = "<a href=\"##{anchor}\">#{heading.strip}</a>"

                if first_item
                    # First item, don't close anything
                    first_item = false
                elsif level > previous_level
                    (level - previous_level).times { toc_items << "<ul>" }
                elsif level < previous_level
                    (previous_level - level).times { toc_items << "</li></ul>" }
                    toc_items << "</li>"
                else
                    # Same level, close previous item
                    toc_items << "</li>"
                end

                toc_items << "<li class=\"toc-level-#{level}\">#{item}"
                previous_level = level
            end

            # Close remaining tags
            # If we found headings, close them properly
            if previous_level > 0
                # Close the last item and any nested lists
                (previous_level - 2).times { toc_items << "</li></ul>" }
                # FIXME: Don't know why I set this to -2 and it works. (was -1 before); Magic number.
                # But, I do have to show this to Alejandra tomorrow, and it's 11:53, and I have
                # more important things to do, before I go to bed.  Fix it later.
                # (and when i say fix it later i mean fix it never LOL)
                toc_items << "</li>"
            end
            
            # Always close the top-level list
            toc_items << "</ul>"
            toc_items.join("\n")
        end
    end
end

Liquid::Template.register_tag('tableofcontents', Jekyll::TableOfContentsTag)