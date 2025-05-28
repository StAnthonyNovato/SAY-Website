# Copyright (c) 2025 Damien Boisvert (AlphaGameDeveloper)
# 
# This software is released under the MIT License.
# https://opensource.org/licenses/MIT

module Jekyll
  class GitMetadataGenerator < Generator
    safe true
    priority :lowest

    def generate(site)
      Jekyll.logger.info "GitMeta", "Fetching latest Git commit metadata..."

      git_info = if git_available?
                   get_git_info
                 elsif github_actions_env?
                   get_github_actions_info
                 else
                   {}
                 end

      if git_info.empty?
        Jekyll.logger.warn "GitMeta", "No Git info available."
      else
        site.data['git'] = git_info
        Jekyll.logger.info "GitMeta", "Loaded commit: #{git_info['short_hash'] || git_info['commit_hash'] || 'N/A'}"
      end
    end

    def git_available?
      system("git rev-parse HEAD > /dev/null 2>&1")
    end

    def github_actions_env?
      ENV['GITHUB_SHA'] && ENV['GITHUB_ACTOR'] && ENV['GITHUB_REPOSITORY']
    end

    def get_git_info
      {
        "commit_hash" => `git rev-parse HEAD`.strip,
        "short_hash"  => `git rev-parse --short HEAD`.strip,
        "author"      => `git log -1 --pretty=format:'%an'`.strip,
        "email"       => `git log -1 --pretty=format:'%ae'`.strip,
        "date"        => `git log -1 --pretty=format:'%ad' --date=iso`.strip,
        "message"     => `git log -1 --pretty=format:'%s'`.strip
      }
    end

    def get_github_actions_info
      {
        "commit_hash" => ENV['GITHUB_SHA'],
        "short_hash"  => ENV['GITHUB_SHA'][0..6],
        "author"      => ENV['GITHUB_ACTOR'],
        "email"       => nil,
        "date"        => ENV['GITHUB_EVENT_HEAD_COMMIT_TIMESTAMP'] || ENV['GITHUB_RUN_STARTED_AT'],
        "message"     => ENV['GITHUB_EVENT_HEAD_COMMIT_MESSAGE'] || "No commit message in env"
      }
    end
  end
end
