# Copyright (c) 2025 Damien Boisvert (AlphaGameDeveloper)
# 
# This software is released under the MIT License.
# https://opensource.org/licenses/MIT

import json
import os
import urllib.parse

# Folder with Lighthouse JSON files
REPORT_DIR = ".lighthouseci"

# Category keys Lighthouse uses
CATEGORY_KEYS = [
    "performance",
    "accessibility",
    "best-practices",
    "seo",
]

def load_reports(folder):
    reports = []
    for filename in os.listdir(folder):
        if filename.endswith(".json"):
            path = os.path.join(folder, filename)
            with open(path, "r") as f:
                reports.append(json.load(f))
    return reports

def average_scores(reports):
    sums = {key: 0 for key in CATEGORY_KEYS}
    counts = {key: 0 for key in CATEGORY_KEYS}
    
    for report in reports:
        cats = report.get("categories", {})
        for key in CATEGORY_KEYS:
            cat = cats.get(key)
            if cat and cat.get("score") is not None:
                sums[key] += cat["score"]
                counts[key] += 1
    
    avgs = {}
    for key in CATEGORY_KEYS:
        avgs[key] = sums[key] / counts[key] if counts[key] > 0 else 0
    return avgs

def score_to_color(score):
    # Green >= 0.9, orange >= 0.5, red otherwise
    if score >= 0.9:
        return "4CAF50"  # green
    elif score >= 0.5:
        return "FF9800"  # orange
    else:
        return "F44336"  # red


def make_quickchart_pie_url(scores):
    labels = []
    values = []
    colors = []
    for cat, score in scores.items():
        labels.append(cat.capitalize())
        values.append(round(score * 100))
        colors.append('#' + score_to_color(score))
    
    chart_config = {
        "type": "pie",
        "data": {
            "labels": labels,
            "datasets": [{
                "data": values,
                "backgroundColor": colors
            }]
        }
    }
    # Encode JSON chart config
    chart_config_str = json.dumps(chart_config, separators=(',', ':'))
    # URL encode the config string
    url = "https://quickchart.io/chart?c=" + urllib.parse.quote(chart_config_str)
    return url


def get_score_ranges(reports):
    """Calculate min/max ranges for each category across all reports"""
    ranges = {}
    for cat in CATEGORY_KEYS:
        scores = []
        for report in reports:
            cats = report.get("categories", {})
            if cat in cats and cats[cat].get("score") is not None:
                scores.append(cats[cat]["score"] * 100)
        
        if scores:
            ranges[cat] = f"{min(scores):.0f}%-{max(scores):.0f}%"
        else:
            ranges[cat] = "N/A"
    
    return ranges


def get_recommendations(avg_scores):
    """Generate specific recommendations based on scores"""
    recommendations = {}
    
    for cat, score in avg_scores.items():
        if cat == "performance":
            if score < 0.5:
                recommendations[cat] = "Optimize images, reduce JS bundles, enable caching"
            elif score < 0.9:
                recommendations[cat] = "Fine-tune resource loading, consider lazy loading"
            else:
                recommendations[cat] = "Maintain current optimizations"
        
        elif cat == "accessibility":
            if score < 0.9:
                recommendations[cat] = "Add alt text, improve color contrast, enhance keyboard navigation"
            else:
                recommendations[cat] = "Excellent accessibility standards maintained"
        
        elif cat == "best-practices":
            if score < 0.9:
                recommendations[cat] = "Update dependencies, fix console errors, use HTTPS"
            else:
                recommendations[cat] = "Following web best practices well"
        
        elif cat == "seo":
            if score < 0.9:
                recommendations[cat] = "Add meta descriptions, improve structured data"
            else:
                recommendations[cat] = "SEO optimization is excellent"
    
    return recommendations


def generate_insights(avg_scores, reports):
    """Generate performance insights based on the data"""
    insights = []
    
    # Performance insights
    perf_score = avg_scores.get("performance", 0)
    if perf_score >= 0.9:
        insights.append("🚀 Excellent performance! Your site loads quickly for users.")
    elif perf_score >= 0.7:
        insights.append("⚡ Good performance with room for optimization.")
    else:
        insights.append("🐌 Performance needs attention - users may experience slow loading.")
    
    # Accessibility insights
    a11y_score = avg_scores.get("accessibility", 0)
    if a11y_score >= 0.95:
        insights.append("♿ Outstanding accessibility - inclusive for all users!")
    elif a11y_score < 0.8:
        insights.append("⚠️ Accessibility improvements needed for better user inclusion.")
    
    # SEO insights
    seo_score = avg_scores.get("seo", 0)
    if seo_score >= 0.9:
        insights.append("🔍 SEO optimized - search engines can easily discover your content.")
    elif seo_score < 0.8:
        insights.append("📈 SEO improvements could boost search visibility.")
    
    # Best practices insights
    bp_score = avg_scores.get("best-practices", 0)
    if bp_score < 0.8:
        insights.append("🛡️ Security and best practices need attention.")
    
    return insights


def extract_key_metrics(reports):
    """Extract key performance metrics from reports"""
    metrics = {
        "First Contentful Paint (s)": {"values": [], "avg": None, "best": None, "worst": None},
        "Largest Contentful Paint (s)": {"values": [], "avg": None, "best": None, "worst": None},
        "Total Blocking Time (ms)": {"values": [], "avg": None, "best": None, "worst": None},
        "Cumulative Layout Shift": {"values": [], "avg": None, "best": None, "worst": None},
        "Speed Index": {"values": [], "avg": None, "best": None, "worst": None}
    }
    
    metric_mappings = {
        "First Contentful Paint (s)": ("first-contentful-paint", 1000),
        "Largest Contentful Paint (s)": ("largest-contentful-paint", 1000), 
        "Total Blocking Time (ms)": ("total-blocking-time", 1),
        "Cumulative Layout Shift": ("cumulative-layout-shift", 1),
        "Speed Index": ("speed-index", 1000)
    }
    
    for report in reports:
        audits = report.get("audits", {})
        for metric_name, (audit_key, divisor) in metric_mappings.items():
            if audit_key in audits:
                value = audits[audit_key].get("numericValue")
                if value is not None:
                    metrics[metric_name]["values"].append(value / divisor)
    
    # Calculate stats
    for metric_name, data in metrics.items():
        if data["values"]:
            data["avg"] = sum(data["values"]) / len(data["values"])
            data["best"] = min(data["values"])
            data["worst"] = max(data["values"])
    
    return metrics


def find_opportunities(reports):
    """Find top optimization opportunities from Lighthouse reports"""
    opportunities = []
    opportunity_weights = {}
    
    for report in reports:
        audits = report.get("audits", {})
        for audit_id, audit_data in audits.items():
            if (audit_data.get("score", 1) is not None and 
                audit_data.get("score", 1) < 1 and 
                audit_data.get("details", {}).get("overallSavingsMs", 0) > 0):
                
                title = audit_data.get("title", audit_id)
                savings_ms = audit_data.get("details", {}).get("overallSavingsMs", 0)
                description = audit_data.get("description", "")
                
                if audit_id not in opportunity_weights:
                    opportunity_weights[audit_id] = {
                        "title": title,
                        "total_savings": 0,
                        "count": 0,
                        "description": description
                    }
                
                opportunity_weights[audit_id]["total_savings"] += savings_ms
                opportunity_weights[audit_id]["count"] += 1
    
    # Convert to list and sort by average savings
    for audit_id, data in opportunity_weights.items():
        avg_savings = data["total_savings"] / data["count"]
        opportunities.append({
            "title": data["title"],
            "savings": f"{avg_savings:.0f}ms",
            "description": data["description"][:100] + "..." if len(data["description"]) > 100 else data["description"]
        })
    
    return sorted(opportunities, key=lambda x: float(x["savings"].replace("ms", "")), reverse=True)


def get_git_commit():
    """Get current git commit hash"""
    try:
        import subprocess
        result = subprocess.run(["git", "rev-parse", "HEAD"], 
                              capture_output=True, text=True, cwd=os.path.dirname(__file__))
        if result.returncode == 0:
            return result.stdout.strip()[:8]  # Short hash
    except:
        pass
    return "unknown"


def make_markdown_report(avg_scores, reports_count, reports):
    from datetime import datetime
    
    md = f"# 🚦 Lighthouse Report Summary ({reports_count} run{'s' if reports_count>1 else ''})\n\n"
    
    # Add timestamp and basic info
    md += f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}\n"
    md += f"**Reports analyzed:** {reports_count}\n\n"
    
    # Overall performance assessment
    overall_score = sum(avg_scores.values()) / len(avg_scores)
    overall_percent = round(overall_score * 100)
    overall_emoji = "🟢" if overall_score >= 0.9 else "🟠" if overall_score >= 0.7 else "🔴"
    md += f"## {overall_emoji} Overall Performance: {overall_percent}%\n\n"
    
    # Detailed scores table with ranges and recommendations
    md += "## 📊 Detailed Scores\n\n"
    md += "| Category       | Score | Status | Range | Recommendation |\n"
    md += "| -------------- | -----:| ------ | ----- | -------------- |\n"
    
    score_ranges = get_score_ranges(reports)
    recommendations = get_recommendations(avg_scores)
    
    for cat, score in avg_scores.items():
        percent = round(score * 100)
        emoji = "🟢" if score >= 0.9 else "🟠" if score >= 0.5 else "🔴"
        status = "Excellent" if score >= 0.9 else "Good" if score >= 0.7 else "Needs Improvement" if score >= 0.5 else "Poor"
        range_info = score_ranges.get(cat, "N/A")
        recommendation = recommendations.get(cat, "No specific recommendations")
        md += f"| {cat.capitalize():14} | {emoji} {percent}% | {status} | {range_info} | {recommendation} |\n"

    # Add pie chart
    chart_url = make_quickchart_pie_url(avg_scores)
    md += f"\n![Lighthouse Scores]({chart_url})\n\n"
    
    # Performance insights
    md += "## 🔍 Performance Insights\n\n"
    insights = generate_insights(avg_scores, reports)
    for insight in insights:
        md += f"- {insight}\n"
    
    # Detailed metrics from reports
    md += "\n## 📈 Key Metrics\n\n"
    metrics = extract_key_metrics(reports)
    if metrics:
        md += "| Metric | Average | Best | Worst |\n"
        md += "| ------ | -------:| ----:| -----:|\n"
        for metric, values in metrics.items():
            if values['avg'] is not None:
                md += f"| {metric} | {values['avg']:.1f} | {values['best']:.1f} | {values['worst']:.1f} |\n"
    
    # Opportunities for improvement
    md += "\n## 🎯 Top Opportunities\n\n"
    opportunities = find_opportunities(reports)
    for i, opp in enumerate(opportunities[:5], 1):
        md += f"{i}. **{opp['title']}** - Potential savings: {opp['savings']}\n"
        md += f"   {opp['description']}\n\n"
    
    # Add raw JSON report links if you want (could be uploaded elsewhere)
    md += "\n---\n"
    md += f"*Generated by Lighthouse CI and Python script at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*\n"
    md += f"*Commit: `{get_git_commit()}`*\n"
    return md

if __name__ == "__main__":
    reports = load_reports(REPORT_DIR)
    if not reports:
        print("No Lighthouse JSON reports found.")
        exit(1)

    avg_scores = average_scores(reports)
    report_md = make_markdown_report(avg_scores, len(reports), reports)
    print(report_md)
