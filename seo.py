#!/usr/bin/env python3
# Copyright (c) 2025 Damien Boisvert (AlphaGameDeveloper)
# 
# This software is released under the MIT License.
# https://opensource.org/licenses/MIT

# Warnings are suppressed for third-party libraries, but you still need to install them:
# pip install requests bs4 colorama tabulate

import os
import re
import requests # type: ignore
import sys
import argparse
import datetime
import concurrent.futures
from bs4 import BeautifulSoup # type: ignore
from urllib.parse import urljoin, urlparse
from colorama import init, Fore, Style # type: ignore
from tabulate import tabulate # type: ignore

# Initialize colorama for cross-platform colored terminal output
init()

class SEOChecker:
    def __init__(self, site_dir, base_url=None, verbose=False, threads=1):
        self.site_dir = site_dir
        self.base_url = base_url
        self.verbose = verbose
        self.threads = threads
        self.issues = []
        self.pages = []
        self.all_links = set()
        self.external_links = set()
        self.broken_links = []
        self.images_without_alt = []
        self.missing_meta = []
        self.header_issues = []
        self.large_pages = []
        
    def log(self, message):
        if self.verbose:
            print(message)
            
    def scan_site(self):
        """Main scanning function to crawl the site directory"""
        print(f"{Fore.CYAN}Starting scan of {self.site_dir}...{Style.RESET_ALL}")
        
        # Check if directory exists
        if not os.path.isdir(self.site_dir):
            print(f"{Fore.RED}Error: Directory '{self.site_dir}' does not exist{Style.RESET_ALL}")
            return False
            
        # Scan all HTML files
        for root, _, files in os.walk(self.site_dir):
            for file in files:
                if file.endswith('.html'):
                    file_path = os.path.join(root, file)
                    relative_path = os.path.relpath(file_path, self.site_dir)
                    
                    self.log(f"Scanning {relative_path}")
                    self.check_page(file_path, relative_path)
        
        # Check for broken links if base_url is provided
        if self.base_url:
            self.check_broken_links()
            
        return True
    
    def check_page(self, file_path, relative_path):
        """Check a single HTML page for SEO issues"""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        soup = BeautifulSoup(content, 'html.parser')
        page_size = len(content) / 1024  # Size in KB
        
        page_data = {
            'path': relative_path,
            'title': self._get_title(soup),
            'description': self._get_meta_description(soup),
            'h1_count': len(soup.find_all('h1')),
            'size_kb': page_size,
            'images': len(soup.find_all('img')),
            'links': len(soup.find_all('a')),
        }
        
        self.pages.append(page_data)
        
        # Check meta information
        self._check_meta_tags(soup, relative_path)
        
        # Check heading structure
        self._check_headings(soup, relative_path)
        
        # Check images
        self._check_images(soup, relative_path)
        
        # Check page size
        if page_size > 500:  # Flag pages over 500KB
            self.large_pages.append({'path': relative_path, 'size_kb': page_size})
        
        # Collect links
        self._collect_links(soup, relative_path)
    
    def _get_title(self, soup):
        """Extract title from HTML"""
        title_tag = soup.find('title')
        return title_tag.text if title_tag else None
    
    def _get_meta_description(self, soup):
        """Extract meta description from HTML"""
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        return meta_desc.get('content') if meta_desc else None
    
    def _check_meta_tags(self, soup, page_path):
        """Check for presence and quality of meta tags"""
        issues = []
        
        # Check title
        title = self._get_title(soup)
        if not title:
            issues.append("Missing title tag")
        elif len(title) < 10:
            issues.append(f"Title too short ({len(title)} chars)")
        elif len(title) > 60:
            issues.append(f"Title too long ({len(title)} chars)")
            
        # Check meta description
        description = self._get_meta_description(soup)
        if not description:
            issues.append("Missing meta description")
        elif len(description) < 50:
            issues.append(f"Meta description too short ({len(description)} chars)")
        elif len(description) > 160:
            issues.append(f"Meta description too long ({len(description)} chars)")
            
        # Check for canonical URL
        canonical = soup.find('link', attrs={'rel': 'canonical'})
        if not canonical:
            issues.append("Missing canonical link")
            
        # Check for viewport meta tag (mobile optimization)
        viewport = soup.find('meta', attrs={'name': 'viewport'})
        if not viewport:
            issues.append("Missing viewport meta tag")
            
        if issues:
            self.missing_meta.append({
                'path': page_path,
                'issues': issues
            })
    
    def _check_headings(self, soup, page_path):
        """Check heading structure"""
        h1_tags = soup.find_all('h1')
        h2_tags = soup.find_all('h2')
        h3_tags = soup.find_all('h3')
        
        issues = []
        
        # Check for h1
        if len(h1_tags) == 0:
            issues.append("Missing H1 tag")
        elif len(h1_tags) > 1:
            issues.append(f"Multiple H1 tags ({len(h1_tags)})")
            
        # Check heading hierarchy
        if len(h3_tags) > 0 and len(h2_tags) == 0:
            issues.append("H3 tags used without H2 tags")
            
        if issues:
            self.header_issues.append({
                'path': page_path,
                'issues': issues
            })
    
    def _check_images(self, soup, page_path):
        """Check for image alt text"""
        for img in soup.find_all('img'):
            if not img.get('alt'):
                self.images_without_alt.append({
                    'path': page_path,
                    'src': img.get('src', 'unknown')
                })
    
    def _collect_links(self, soup, page_path):
        """Collect all links for later checking"""
        for a_tag in soup.find_all('a', href=True):
            href = a_tag['href']
            
            # Skip anchors and javascript links
            if href.startswith('#') or href.startswith('javascript:'):
                continue
            
            # Detect external links by http/https protocol
            is_external = href.startswith(('http://', 'https://'))
            
            # Add to all links collection
            if self.base_url:
                # Properly handle relative URLs
                full_url = urljoin(self.base_url, href)
                self.all_links.add((full_url, page_path))
                
                # Mark as external if it has http/https and doesn't contain our base domain
                base_domain = urlparse(self.base_url).netloc
                if is_external and base_domain not in href:
                    self.log(f"Found external link: {href} on page {page_path}")
                    self.external_links.add(href)
            else:
                # Without base_url, consider any absolute URL as external
                self.all_links.add((href, page_path))
                if is_external:
                    self.log(f"Found external link: {href} on page {page_path}")
                    self.external_links.add(href)
    
    def check_broken_links(self):
        """Check for broken links (only works with base_url)"""
        print(f"{Fore.CYAN}Checking for broken links...{Style.RESET_ALL}")
        
        if not self.base_url:
            print(f"{Fore.YELLOW}Warning: Base URL not provided, skipping link validation{Style.RESET_ALL}")
            return
            
        # Count for progress indication
        total_links = len(self.all_links)
        if total_links == 0:
            print(f"{Fore.RED}  No links to check{Style.RESET_ALL}")
            return

        print(f"  {Fore.GREEN}Found {total_links} links to check using {self.threads} thread(s){Style.RESET_ALL}")

        # Convert set to list for threading
        links_to_check = list(self.all_links)
        checked = 0
        
        # Function to check a single link
        def check_link(link_data):
            link, source_page = link_data
            result = None
            
            try:
                percentageComplete = "[{:.0f}%]".format((checked / total_links) * 100)
                if link.startswith(('http://', 'https://')):
                    if self.verbose:
                        print(f"{percentageComplete} {Fore.LIGHTBLACK_EX}Checking link: {link} from {source_page}{Style.RESET_ALL}")

                    # Use a proper user agent to avoid being blocked
                    headers = {
                        'User-Agent': 'Mozilla/5.0 (compatible; SEOChecker/1.0; +damien@alphagame.dev)'
                    }
                    
                    # Try HEAD request first, which is faster
                    try:
                        response = requests.head(link, timeout=5, headers=headers, allow_redirects=True)
                        # If HEAD is not supported, try GET
                        if response.status_code >= 400:
                            response = requests.get(link, timeout=5, headers=headers, allow_redirects=True)
                    except requests.RequestException:
                        # If HEAD fails, try GET
                        response = requests.get(link, timeout=5, headers=headers, allow_redirects=True)
                        
                    if response.status_code >= 400:
                        result = {
                            'link': link,
                            'source': source_page,
                            'status': response.status_code
                        }
            except requests.RequestException as e:
                result = {
                    'link': link,
                    'source': source_page,
                    'status': str(e)
                }
            
            return result
        
        # Use ThreadPoolExecutor to check links in parallel
        if self.threads > 1:
            with concurrent.futures.ThreadPoolExecutor(max_workers=self.threads) as executor:
                # Submit all tasks
                future_to_link = {executor.submit(check_link, link_data): link_data for link_data in links_to_check}
                
                # Process results as they complete
                for i, future in enumerate(concurrent.futures.as_completed(future_to_link)):
                    checked += 1
                    if checked % 10 == 0 or checked == total_links:
                        print(f"  Checking links: {checked}/{total_links}", end='\r')
                    
                    result = future.result()
                    if result:
                        self.broken_links.append(result)
                        if self.verbose:
                            print(f"{Fore.RED}  Broken link: {result['link']} ({result['status']}){Style.RESET_ALL}")
        else:
            # Single-threaded operation
            for link_data in links_to_check:
                checked += 1
                if checked % 10 == 0 or checked == total_links:
                    print(f"  Checking links: {checked}/{total_links}", end='\r')
                
                result = check_link(link_data)
                if result:
                    self.broken_links.append(result)

        print(f"\n  Found {len(self.broken_links)} broken links")

    def generate_report(self):
        """Generate a comprehensive SEO report"""
        print(f"\n{Fore.GREEN}=== SEO Report ===={Style.RESET_ALL}\n")
        
        # Summary
        print(f"{Fore.CYAN}Summary:{Style.RESET_ALL}")
        print(f"Pages scanned: {len(self.pages)}")
        print(f"Pages with meta issues: {len(self.missing_meta)}")
        print(f"Pages with heading issues: {len(self.header_issues)}")
        print(f"Images without alt text: {len(self.images_without_alt)}")
        print(f"Broken links: {len(self.broken_links)}")
        print(f"Large pages (>500KB): {len(self.large_pages)}")
        print(f"External links: {len(self.external_links)}")
        print()
        
        # Meta issues
        if self.missing_meta:
            print(f"\n{Fore.YELLOW}Pages with Meta Tag Issues:{Style.RESET_ALL}")
            for issue in self.missing_meta:
                print(f"  {issue['path']}")
                for i in issue['issues']:
                    print(f"    - {i}")
        
        # Heading issues
        if self.header_issues:
            print(f"\n{Fore.YELLOW}Pages with Heading Issues:{Style.RESET_ALL}")
            for issue in self.header_issues:
                print(f"  {issue['path']}")
                for i in issue['issues']:
                    print(f"    - {i}")
        
        # Alt text issues
        if self.images_without_alt:
            print(f"\n{Fore.YELLOW}Images Without Alt Text:{Style.RESET_ALL}")
            table_data = [(i['path'], i['src']) for i in self.images_without_alt[:10]]
            print(tabulate(table_data, headers=["Page", "Image Source"], tablefmt="simple"))
            if len(self.images_without_alt) > 10:
                print(f"  ...and {len(self.images_without_alt) - 10} more")
        
        # Broken links
        if self.broken_links:
            print(f"\n{Fore.RED}Broken Links:{Style.RESET_ALL}")
            table_data = [(l['source'], l['link'], l['status']) for l in self.broken_links[:10]]
            print(tabulate(table_data, headers=["Source Page", "Link", "Status"], tablefmt="simple"))
            if len(self.broken_links) > 10:
                print(f"  ...and {len(self.broken_links) - 10} more")
        
        # Large pages
        if self.large_pages:
            print(f"\n{Fore.YELLOW}Large Pages (>500KB):{Style.RESET_ALL}")
            table_data = [(p['path'], f"{p['size_kb']:.2f} KB") for p in self.large_pages]
            print(tabulate(table_data, headers=["Page", "Size"], tablefmt="simple"))
        
        # Page titles and descriptions
        print(f"\n{Fore.CYAN}Page Titles and Descriptions:{Style.RESET_ALL}")
        titles_data = []
        for page in self.pages[:10]:
            title = page['title'] or 'MISSING'
            desc = page['description'] or 'MISSING'
            if len(desc) > 50:
                desc = desc[:47] + '...'
            titles_data.append([page['path'], title, desc])
        
        print(tabulate(titles_data, headers=["Page", "Title", "Description"], tablefmt="simple"))
        if len(self.pages) > 10:
            print(f"  ...and {len(self.pages) - 10} more pages")

    def generate_html_report(self, output_file):
        """Generate an HTML report with styling"""
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        site_dir = os.path.abspath(self.site_dir)
        
        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SEO Report - {site_dir}</title>
    <style>
        :root {{
            --primary: #2563eb;
            --primary-dark: #1d4ed8;
            --secondary: #475569;
            --error: #ef4444;
            --warning: #f59e0b;
            --success: #10b981;
            --light: #f8fafc;
            --dark: #1e293b;
        }}
        
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: var(--dark);
            background-color: var(--light);
            margin: 0;
            padding: 20px;
        }}
        
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }}
        
        header {{
            margin-bottom: 30px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 20px;
        }}
        
        h1, h2, h3, h4 {{
            color: var(--primary-dark);
            margin-top: 1.5em;
        }}
        
        h1 {{
            font-size: 2em;
            margin-top: 0;
        }}
        
        .summary-cards {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }}
        
        .card {{
            background-color: white;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            border-left: 5px solid var(--primary);
        }}
        
        .card.warning {{
            border-left-color: var(--warning);
        }}
        
        .card.error {{
            border-left-color: var(--error);
        }}
        
        .card.success {{
            border-left-color: var(--success);
        }}
        
        .card h3 {{
            margin-top: 0;
            font-size: 1.1em;
            color: var(--secondary);
        }}
        
        .card p {{
            font-size: 1.8em;
            font-weight: bold;
            margin: 10px 0 0;
            color: var(--dark);
        }}
        
        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 0.9em;
        }}
        
        th {{
            background-color: var(--primary);
            color: white;
            text-align: left;
            padding: 12px;
        }}
        
        td {{
            padding: 10px 12px;
            border-top: 1px solid #e2e8f0;
        }}
        
        tr:nth-child(even) {{
            background-color: #f8fafc;
        }}
        
        .issue-list {{
            margin-left: 20px;
            color: var(--error);
        }}
        
        .issue-list li {{
            margin-bottom: 5px;
        }}
        
        .status-ok {{
            color: var(--success);
        }}
        
        .status-warning {{
            color: var(--warning);
        }}
        
        .status-error {{
            color: var(--error);
        }}
        
        .meta {{
            color: var(--secondary);
            font-size: 0.8em;
            margin-top: 50px;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
        }}
        
        .expandable {{
            cursor: pointer;
        }}
        
        .expandable::after {{
            content: " +";
            font-weight: bold;
            color: var(--primary);
        }}
        
        .expanded::after {{
            content: " -";
        }}
        
        .content {{
            display: none;
            padding: 10px;
            background-color: #f8fafc;
            border-radius: 4px;
        }}
        
        .show {{
            display: block;
        }}
        
        @media (max-width: 768px) {{
            .summary-cards {{
                grid-template-columns: 1fr;
            }}
            
            table {{
                font-size: 0.8em;
            }}
        }}
    </style>
    <script>
        document.addEventListener('DOMContentLoaded', function() {{
            // Add click event to all expandable elements
            document.querySelectorAll('.expandable').forEach(item => {{
                item.addEventListener('click', event => {{
                    item.classList.toggle('expanded');
                    const content = item.nextElementSibling;
                    content.classList.toggle('show');
                }});
            }});
        }});
    </script>
</head>
<body>
    <div class="container">
        <header>
            <h1>SEO and Website Health Report</h1>
            <p>Analysis of <strong>{site_dir}</strong></p>
            <p>Generated on <em>{timestamp}</em></p>
        </header>
        
        <h2>Summary</h2>
        <div class="summary-cards">
            <div class="card">
                <h3>Pages Scanned</h3>
                <p>{len(self.pages)}</p>
            </div>
            <div class="card {'warning' if self.missing_meta else 'success'}">
                <h3>Meta Tag Issues</h3>
                <p>{len(self.missing_meta)}</p>
            </div>
            <div class="card {'warning' if self.header_issues else 'success'}">
                <h3>Heading Issues</h3>
                <p>{len(self.header_issues)}</p>
            </div>
            <div class="card {'warning' if self.images_without_alt else 'success'}">
                <h3>Images Without Alt</h3>
                <p>{len(self.images_without_alt)}</p>
            </div>
            <div class="card {'error' if self.broken_links else 'success'}">
                <h3>Broken Links</h3>
                <p>{len(self.broken_links)}</p>
            </div>
            <div class="card {'warning' if self.large_pages else 'success'}">
                <h3>Large Pages</h3>
                <p>{len(self.large_pages)}</p>
            </div>
            <div class="card">
                <h3>External Links</h3>
                <p>{len(self.external_links)}</p>
            </div>
        </div>
        """
        
        # Meta issues
        if self.missing_meta:
            html += """
            <h2>Pages with Meta Tag Issues</h2>
            <table>
                <thead>
                    <tr>
                        <th>Page</th>
                        <th>Issues</th>
                    </tr>
                </thead>
                <tbody>
            """
            
            for issue in self.missing_meta:
                issues_html = "<ul class='issue-list'>"
                for i in issue['issues']:
                    issues_html += f"<li>{i}</li>"
                issues_html += "</ul>"
                
                html += f"""
                <tr>
                    <td>{issue['path']}</td>
                    <td>{issues_html}</td>
                </tr>
                """
            html += """
                </tbody>
            </table>
            """
        
        # Heading issues
        if self.header_issues:
            html += """
            <h2>Pages with Heading Structure Issues</h2>
            <table>
                <thead>
                    <tr>
                        <th>Page</th>
                        <th>Issues</th>
                    </tr>
                </thead>
                <tbody>
            """
            
            for issue in self.header_issues:
                issues_html = "<ul class='issue-list'>"
                for i in issue['issues']:
                    issues_html += f"<li>{i}</li>"
                issues_html += "</ul>"
                
                html += f"""
                <tr>
                    <td>{issue['path']}</td>
                    <td>{issues_html}</td>
                </tr>
                """
            html += """
                </tbody>
            </table>
            """
        
        # Images without alt text
        if self.images_without_alt:
            html += """
            <h2>Images Without Alt Text</h2>
            <p>Alternative text is essential for accessibility and SEO.</p>
            <table>
                <thead>
                    <tr>
                        <th>Page</th>
                        <th>Image Source</th>
                    </tr>
                </thead>
                <tbody>
            """
            
            for img in self.images_without_alt:
                html += f"""
                <tr>
                    <td>{img['path']}</td>
                    <td>{img['src']}</td>
                </tr>
                """
            html += """
                </tbody>
            </table>
            """
        
        # Broken links
        if self.broken_links:
            html += """
            <h2>Broken Links</h2>
            <p class="status-error">These links returned errors and should be fixed.</p>
            <table>
                <thead>
                    <tr>
                        <th>Source Page</th>
                        <th>Link</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
            """
            
            for link in self.broken_links:
                html += f"""
                <tr>
                    <td>{link['source']}</td>
                    <td>{link['link']}</td>
                    <td class="status-error">{link['status']}</td>
                </tr>
                """
            html += """
                </tbody>
            </table>
            """
        
        # Large pages
        if self.large_pages:
            html += """
            <h2>Large Pages (>500KB)</h2>
            <p class="status-warning">These pages may load slowly, especially on mobile devices.</p>
            <table>
                <thead>
                    <tr>
                        <th>Page</th>
                        <th>Size</th>
                    </tr>
                </thead>
                <tbody>
            """
            
            for page in self.large_pages:
                html += f"""
                <tr>
                    <td>{page['path']}</td>
                    <td class="status-warning">{page['size_kb']:.2f} KB</td>
                </tr>
                """
            html += """
                </tbody>
            </table>
            """
        
        # Page titles and descriptions
        html += """
        <h2>Page Titles and Descriptions</h2>
        <div class="expandable">Click to view all pages</div>
        <div class="content">
            <table>
                <thead>
                    <tr>
                        <th>Page</th>
                        <th>Title</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
        """
        
        for page in self.pages:
            title = page['title'] or '<span class="status-error">MISSING</span>'
            desc = page['description'] or '<span class="status-error">MISSING</span>'
            
            title_class = ""
            if page['title']:
                if len(page['title']) < 10:
                    title_class = "class='status-warning'"
                elif len(page['title']) > 60:
                    title_class = "class='status-warning'"
            
            desc_class = ""
            if page['description']:
                if len(page['description']) < 50:
                    desc_class = "class='status-warning'"
                elif len(page['description']) > 160:
                    desc_class = "class='status-warning'"
            
            html += f"""
            <tr>
                <td>{page['path']}</td>
                <td {title_class}>{title}</td>
                <td {desc_class}>{desc}</td>
            </tr>
            """
        
        html += """
                </tbody>
            </table>
        </div>
        """
        
        # External links
        if self.external_links:
            html += """
            <h2>External Links</h2>
            <div class="expandable">Click to view all external links</div>
            <div class="content">
                <table>
                    <thead>
                        <tr>
                            <th>URL</th>
                        </tr>
                    </thead>
                    <tbody>
            """
            
            for link in sorted(self.external_links):
                html += f"""
                <tr>
                    <td><a href="{link}" target="_blank">{link}</a></td>
                </tr>
                """
            
            html += """
                    </tbody>
                </table>
            </div>
            """
        
        # Footer
        html += f"""
        <div class="meta">
            <p>Report generated on {timestamp}</p>
            <p>Analyzed {len(self.pages)} pages in {site_dir}</p>
            <p>&copy; AlphaSEOTool Damien Boisvert 2025</p>
            <p>Ran on Python version {".".join(map(str, sys.version_info[:3]))}, {sys.platform}</p>
        </div>
    </div>
</body>
</html>
        """
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html)
            
        print(f"{Fore.GREEN}HTML report saved to {output_file}{Style.RESET_ALL}")
        
        return output_file

def main():
    parser = argparse.ArgumentParser(description='SEO and Website Health Checker')
    parser.add_argument('--dir', default='_site', help='Directory to scan (default: _site)')
    parser.add_argument('--base-url', help='Base URL of the website for link checking')
    parser.add_argument('--verbose', '-v', action='store_true', help='Enable verbose output')
    parser.add_argument('--html-output', help='Generate HTML report and save to specified file')
    parser.add_argument('--threads', type=int, default=1, help='Number of threads for parallel operations (default: 1)')
    
    args = parser.parse_args()
    
    # Validate thread count
    if args.threads < 1:
        print(f"{Fore.YELLOW}Warning: Invalid thread count ({args.threads}), using 1 thread{Style.RESET_ALL}")
        args.threads = 1
    
    checker = SEOChecker(args.dir, args.base_url, args.verbose, args.threads)
    if checker.scan_site():
        checker.generate_report()
        
        # Generate HTML report if requested
        if args.html_output:
            checker.generate_html_report(args.html_output)

if __name__ == "__main__":
    main()

