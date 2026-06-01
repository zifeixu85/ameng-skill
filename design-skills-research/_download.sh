#!/usr/bin/env bash
# Downloads design-related SKILL.md files into flat research folder with _source.yaml provenance.
set -uo pipefail
ROOT="/Users/ameng/Workspace/ameng-skill/design-skills-research"
cd "$ROOT"
TODAY="2026-06-02"

# format: destdir | repo | path | source_type | skill_format
GH_ENTRIES=(
"[github]-anthropics-frontend-design|anthropics/skills|skills/frontend-design/SKILL.md|github|universal"
"[github]-vercel-web-design-guidelines|vercel-labs/agent-skills|skills/web-design-guidelines/SKILL.md|github|universal"
"[github]-sleek-design-mobile-apps|sleekdotdesign/agent-skills|skills/design-mobile-apps/SKILL.md|github|universal"
"[github]-arvindrk-extract-design-system|arvindrk/extract-design-system|skills/extract-design-system/SKILL.md|github|universal"
"[github]-leonxlnx-design-taste-frontend|leonxlnx/taste-skill|skills/taste-skill/SKILL.md|github|universal"
"[github]-leonxlnx-imagegen-frontend-web|leonxlnx/taste-skill|skills/imagegen-frontend-web/SKILL.md|github|universal"
"[github]-pbakaus-impeccable|pbakaus/impeccable|.claude/skills/impeccable/SKILL.md|github|universal"
"[github]-mattpocock-prototype|mattpocock/skills|skills/engineering/prototype/SKILL.md|github|universal"
"[github]-mattpocock-design-an-interface|mattpocock/skills|skills/deprecated/design-an-interface/SKILL.md|github|universal"
"[github]-nlb-ui-ux-pro-max|nextlevelbuilder/ui-ux-pro-max-skill|.claude/skills/ui-ux-pro-max/SKILL.md|github|claude-code"
"[github]-nlb-design-system|nextlevelbuilder/ui-ux-pro-max-skill|.claude/skills/design-system/SKILL.md|github|claude-code"
"[github]-nlb-ui-styling|nextlevelbuilder/ui-ux-pro-max-skill|.claude/skills/ui-styling/SKILL.md|github|claude-code"
"[github]-lenny-design-systems|refoundai/lenny-skills|skills/design-systems/SKILL.md|github|universal"
"[github]-lenny-design-engineering|refoundai/lenny-skills|skills/design-engineering/SKILL.md|github|universal"
"[github]-lenny-behavioral-product-design|refoundai/lenny-skills|skills/behavioral-product-design/SKILL.md|github|universal"
"[github]-owl-design-critique|owl-listener/designer-skills|design-ops/skills/design-critique/SKILL.md|github|universal"
"[github]-owl-design-token|owl-listener/designer-skills|design-systems/skills/design-token/SKILL.md|github|universal"
"[github]-owl-accessibility-audit|owl-listener/designer-skills|design-systems/skills/accessibility-audit/SKILL.md|github|universal"
"[github]-owl-user-persona|owl-listener/designer-skills|design-research/skills/user-persona/SKILL.md|github|universal"
"[github]-owl-journey-map|owl-listener/designer-skills|design-research/skills/journey-map/SKILL.md|github|universal"
"[github]-microsoft-frontend-design-review|microsoft/skills|.github/skills/frontend-design-review/SKILL.md|github|universal"
"[github]-jezweb-design-review|jezweb/claude-skills|plugins/frontend/skills/design-review/SKILL.md|github|claude-code"
"[github]-jezweb-design-loop|jezweb/claude-skills|plugins/frontend/skills/design-loop/SKILL.md|github|claude-code"
"[github]-wshobson-interaction-design|wshobson/agents|plugins/ui-design/skills/interaction-design/SKILL.md|github|universal"
"[github]-wshobson-design-system-patterns|wshobson/agents|plugins/ui-design/skills/design-system-patterns/SKILL.md|github|universal"
"[github]-beagle-shadcn-ui|existential-birds/beagle|plugins/beagle-react/skills/shadcn-ui/SKILL.md|github|claude-code"
"[github]-beagle-review-frontend|existential-birds/beagle|plugins/beagle-react/skills/review-frontend/SKILL.md|github|claude-code"
"[github]-garrytan-design-review|garrytan/gstack|design-review/SKILL.md|github|universal"
"[github]-garrytan-design-consultation|garrytan/gstack|design-consultation/SKILL.md|github|universal"
"[github]-garrytan-design-html|garrytan/gstack|design-html/SKILL.md|github|universal"
"[github]-wholiver-swiftui-design|Wholiver/swiftui-design-skill|SKILL.md|github|universal"
"[github]-akhilbhima-frontend-design|akhilbhima/akhils-frontend-design-skill|skills/frontend-design/SKILL.md|github|universal"
"[github]-shubhamsaboo-ux-designer|shubhamsaboo/awesome-llm-apps|awesome_agent_skills/ux-designer/SKILL.md|github|universal"
"[github]-shadcn-shadcn|shadcn-ui/ui|skills/shadcn/SKILL.md|github|universal"
)

CLAW_ENTRIES=(
"[clawhub]-antonia-frontend-design-pro|frontend-design-pro"
"[clawhub]-alsoforever-product-design-gungun|product-design-gungun"
"[clawhub]-binggg-ui-design-guide|ui-design-guide"
"[clawhub]-contsun-prototype-design|prototype-design"
"[clawhub]-xobi667-ui-ux-pro-max|ui-ux-pro-max"
"[clawhub]-52yc-screenshot-ux-auditor|screenshot-ux-auditor"
"[clawhub]-tommygeoco-ui-audit|ui-audit"
)

echo "### GitHub downloads ###"
for e in "${GH_ENTRIES[@]}"; do
  IFS='|' read -r dest repo path stype sfmt <<< "$e"
  mkdir -p "$dest"
  if gh api "repos/$repo/contents/$path" -H "Accept: application/vnd.github.raw" > "$dest/SKILL.md" 2>/dev/null && [ -s "$dest/SKILL.md" ]; then
    lines=$(wc -l < "$dest/SKILL.md" | tr -d ' ')
    printf 'url: "https://github.com/%s/blob/HEAD/%s"\nfetched_at: "%s"\nsource_type: "%s"\nskill_format: "%s"\n' "$repo" "$path" "$TODAY" "$stype" "$sfmt" > "$dest/_source.yaml"
    echo "OK   $dest ($lines lines)"
  else
    echo "FAIL $dest <- $repo/$path"
    rm -rf "$dest"
  fi
done

echo
echo "### ClawHub downloads ###"
for e in "${CLAW_ENTRIES[@]}"; do
  IFS='|' read -r dest slug <<< "$e"
  mkdir -p "$dest"
  if npx -y clawhub@latest inspect "$slug" --file SKILL.md > "$dest/SKILL.md" 2>/dev/null && [ -s "$dest/SKILL.md" ]; then
    lines=$(wc -l < "$dest/SKILL.md" | tr -d ' ')
    printf 'url: "https://clawhub.ai/skills/%s"\nfetched_at: "%s"\nsource_type: "community"\nskill_format: "openclaw"\n' "$slug" "$TODAY" > "$dest/_source.yaml"
    echo "OK   $dest ($lines lines)"
  else
    echo "FAIL $dest <- clawhub:$slug"
    rm -rf "$dest"
  fi
done

echo
echo "### Summary ###"
echo "Total skill dirs: $(find . -maxdepth 1 -type d -name '[*' | wc -l | tr -d ' ')"
