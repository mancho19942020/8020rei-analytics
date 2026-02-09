#!/usr/bin/env python3
"""
Design System Violation Scanner

Scans Vue files for violations of the Axis design system rules.
Outputs structured violations with file path, line number, and severity.
"""

import re
import sys
from pathlib import Path
from typing import List, Dict, Any
import json


class ViolationScanner:
    def __init__(self, base_path: str):
        self.base_path = Path(base_path)
        self.violations: List[Dict[str, Any]] = []

    def scan_file(self, file_path: Path) -> None:
        """Scan a single Vue file for design system violations."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()

            relative_path = file_path.relative_to(self.base_path)

            for line_num, line in enumerate(lines, start=1):
                self._check_raw_html_elements(relative_path, line_num, line)
                self._check_color_tokens(relative_path, line_num, line)
                self._check_typography(relative_path, line_num, line)
                self._check_motion(relative_path, line_num, line)
                self._check_accessibility(relative_path, line_num, line)

        except Exception as e:
            print(f"Error scanning {file_path}: {e}", file=sys.stderr)

    def _check_raw_html_elements(self, file_path: Path, line_num: int, line: str) -> None:
        """Check for raw HTML elements that should use Axis components."""
        # Skip if in design-system documentation
        if 'design-system' in str(file_path):
            return

        # Check for raw buttons
        if re.search(r'<button(?:\s|>)', line) and 'AxisButton' not in line:
            self.violations.append({
                'file': str(file_path),
                'line': line_num,
                'severity': 'critical',
                'category': 'components',
                'rule': 'Raw HTML button element',
                'violation': line.strip(),
                'fix': 'Replace with <AxisButton>',
                'reference': 'CLAUDE.md - Axis Components (MANDATORY)'
            })

        # Check for raw inputs
        if re.search(r'<input(?:\s|>)', line) and 'AxisInput' not in line:
            self.violations.append({
                'file': str(file_path),
                'line': line_num,
                'severity': 'critical',
                'category': 'components',
                'rule': 'Raw HTML input element',
                'violation': line.strip(),
                'fix': 'Replace with <AxisInput>',
                'reference': 'CLAUDE.md - Axis Components (MANDATORY)'
            })

        # Check for raw select
        if re.search(r'<select(?:\s|>)', line) and 'AxisSelect' not in line:
            self.violations.append({
                'file': str(file_path),
                'line': line_num,
                'severity': 'critical',
                'category': 'components',
                'rule': 'Raw HTML select element',
                'violation': line.strip(),
                'fix': 'Replace with <AxisSelect>',
                'reference': 'CLAUDE.md - Axis Components (MANDATORY)'
            })

    def _check_color_tokens(self, file_path: Path, line_num: int, line: str) -> None:
        """Check for non-semantic color usage."""
        # Skip if in design-system documentation
        if 'design-system' in str(file_path):
            return

        # List of raw color names that should not be used
        raw_colors = ['blue', 'green', 'red', 'yellow', 'purple', 'pink', 'indigo',
                      'cyan', 'teal', 'orange', 'lime', 'emerald', 'sky', 'violet',
                      'fuchsia', 'rose', 'amber', 'slate', 'gray', 'zinc', 'stone']

        for color in raw_colors:
            # Check for bg-, text-, border- with raw color names
            patterns = [
                rf'\bbg-{color}-\d+',
                rf'\btext-{color}-\d+',
                rf'\bborder-{color}-\d+',
                rf'\bfrom-{color}-\d+',
                rf'\bto-{color}-\d+',
                rf'\bvia-{color}-\d+',
            ]

            for pattern in patterns:
                if re.search(pattern, line):
                    self.violations.append({
                        'file': str(file_path),
                        'line': line_num,
                        'severity': 'critical',
                        'category': 'colors',
                        'rule': 'Non-semantic color token',
                        'violation': line.strip(),
                        'fix': f'Use semantic tokens: main, neutral, success, error, alert, info, accent-1 through accent-5',
                        'reference': 'CLAUDE.md - Color Token Structure'
                    })
                    break

    def _check_typography(self, file_path: Path, line_num: int, line: str) -> None:
        """Check for typography violations."""
        # Check for hardcoded text sizes instead of tokens
        if re.search(r'\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b', line):
            self.violations.append({
                'file': str(file_path),
                'line': line_num,
                'severity': 'warning',
                'category': 'typography',
                'rule': 'Hardcoded text size',
                'violation': line.strip(),
                'fix': 'Use semantic typography tokens: text-h1 through text-h5, text-body-large, text-body-regular, text-label, text-suggestion',
                'reference': 'CLAUDE.md - Typography Tokens'
            })

        # Check for low contrast text colors
        low_contrast_patterns = [
            r'\btext-neutral-[1234]00\b',
            r'\btext-\w+-[1234]00\b'
        ]

        for pattern in low_contrast_patterns:
            if re.search(pattern, line) and 'bg-' in line:
                self.violations.append({
                    'file': str(file_path),
                    'line': line_num,
                    'severity': 'critical',
                    'category': 'accessibility',
                    'rule': 'Low contrast text color',
                    'violation': line.strip(),
                    'fix': 'Use neutral-700+ for body text, neutral-800+ for headings',
                    'reference': 'CLAUDE.md - Contrast & Accessibility'
                })

    def _check_motion(self, file_path: Path, line_num: int, line: str) -> None:
        """Check for motion/animation violations."""
        # Check for transition-all (should be specific)
        if 'transition-all' in line:
            self.violations.append({
                'file': str(file_path),
                'line': line_num,
                'severity': 'warning',
                'category': 'motion',
                'rule': 'Non-specific transition property',
                'violation': line.strip(),
                'fix': 'Use specific transition properties: transition-colors, transition-opacity, transition-transform, transition-shadow',
                'reference': 'CLAUDE.md - Motion (MANDATORY)'
            })

        # Check for long durations (>500ms)
        if re.search(r'duration-([6-9]\d{2,}|[1-9]\d{3,})', line):
            self.violations.append({
                'file': str(file_path),
                'line': line_num,
                'severity': 'warning',
                'category': 'motion',
                'rule': 'Animation duration too long',
                'violation': line.strip(),
                'fix': 'Never exceed 500ms (duration-500) for UI feedback',
                'reference': 'CLAUDE.md - Motion (MANDATORY)'
            })

    def _check_accessibility(self, file_path: Path, line_num: int, line: str) -> None:
        """Check for accessibility violations."""
        # Check for interactive elements without aria-label
        interactive_patterns = [
            r'<button(?!.*aria-label)(?!.*aria-labelledby)',
            r'<a(?!.*aria-label)(?!.*aria-labelledby).*>.*<svg',  # Icon links without labels
        ]

        for pattern in interactive_patterns:
            if re.search(pattern, line, re.IGNORECASE):
                # Check if the element has visible text content
                if not re.search(r'>[^<]+</', line):
                    self.violations.append({
                        'file': str(file_path),
                        'line': line_num,
                        'severity': 'critical',
                        'category': 'accessibility',
                        'rule': 'Missing aria-label on interactive element',
                        'violation': line.strip(),
                        'fix': 'Add aria-label="Description" to interactive elements without visible text',
                        'reference': 'CLAUDE.md - Pre-Commit Protocol'
                    })

    def scan_directory(self, directory: str, exclude_patterns: List[str] = None) -> None:
        """Recursively scan a directory for Vue files."""
        if exclude_patterns is None:
            exclude_patterns = ['node_modules', '.git', 'dist', '.nuxt']

        directory_path = Path(directory)

        for file_path in directory_path.rglob('*.vue'):
            # Skip excluded directories
            if any(pattern in str(file_path) for pattern in exclude_patterns):
                continue

            self.scan_file(file_path)

    def get_report(self, format: str = 'json') -> str:
        """Generate a report of violations."""
        if format == 'json':
            return json.dumps(self.violations, indent=2)
        elif format == 'markdown':
            return self._generate_markdown_report()
        else:
            return self._generate_text_report()

    def _generate_markdown_report(self) -> str:
        """Generate a markdown-formatted report."""
        if not self.violations:
            return "# Design System Validation Report\n\n✅ No violations found!\n"

        report = "# Design System Validation Report\n\n"
        report += f"**Total Violations:** {len(self.violations)}\n\n"

        # Group by severity
        critical = [v for v in self.violations if v['severity'] == 'critical']
        warning = [v for v in self.violations if v['severity'] == 'warning']

        if critical:
            report += f"## 🚨 Critical Issues ({len(critical)})\n\n"
            for v in critical:
                report += f"### {v['file']}:{v['line']}\n"
                report += f"**Category:** {v['category']}\n\n"
                report += f"**Rule:** {v['rule']}\n\n"
                report += f"**Violation:**\n```vue\n{v['violation']}\n```\n\n"
                report += f"**Fix:** {v['fix']}\n\n"
                report += f"**Reference:** {v['reference']}\n\n"
                report += "---\n\n"

        if warning:
            report += f"## ⚠️  Warnings ({len(warning)})\n\n"
            for v in warning:
                report += f"### {v['file']}:{v['line']}\n"
                report += f"**Category:** {v['category']}\n\n"
                report += f"**Rule:** {v['rule']}\n\n"
                report += f"**Violation:**\n```vue\n{v['violation']}\n```\n\n"
                report += f"**Fix:** {v['fix']}\n\n"
                report += f"**Reference:** {v['reference']}\n\n"
                report += "---\n\n"

        return report

    def _generate_text_report(self) -> str:
        """Generate a plain text report."""
        if not self.violations:
            return "No violations found!"

        report = f"Design System Validation Report\n"
        report += f"Total Violations: {len(self.violations)}\n\n"

        for v in self.violations:
            report += f"[{v['severity'].upper()}] {v['file']}:{v['line']}\n"
            report += f"  Category: {v['category']}\n"
            report += f"  Rule: {v['rule']}\n"
            report += f"  Fix: {v['fix']}\n\n"

        return report


def main():
    """Main entry point for the scanner."""
    if len(sys.argv) < 2:
        print("Usage: python scan_violations.py <directory> [--format json|markdown|text]")
        sys.exit(1)

    directory = sys.argv[1]
    format = 'markdown'

    if '--format' in sys.argv:
        format_idx = sys.argv.index('--format')
        if format_idx + 1 < len(sys.argv):
            format = sys.argv[format_idx + 1]

    scanner = ViolationScanner(directory)
    scanner.scan_directory(directory)

    print(scanner.get_report(format))

    # Exit with error code if critical violations found
    critical_count = len([v for v in scanner.violations if v['severity'] == 'critical'])
    sys.exit(1 if critical_count > 0 else 0)


if __name__ == '__main__':
    main()
