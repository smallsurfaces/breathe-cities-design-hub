# Figma Token Sync

This directory contains configuration to sync design tokens from this repo into Figma as **Variables** using the [Token Studio](https://tokens.studio/) plugin.

---

## Prerequisites

- Figma account with the [Token Studio plugin](https://www.figma.com/community/plugin/843461159747178978) installed
- A GitHub personal access token with `repo` read access
- This repo pushed to GitHub

---

## One-time Setup

### 1. Install Token Studio in Figma

Open Figma → Plugins → Search "Token Studio" → Install

### 2. Connect to GitHub

Open Token Studio → Settings → Sync → GitHub

Fill in:
| Field | Value |
|---|---|
| Name | `Breathe Cities Tokens` |
| Personal Access Token | your GitHub PAT |
| Repository | `your-username/breath-city-test` |
| Branch | `main` |
| File path | `tokens` |

Click **Save** → **Pull from GitHub**

Token Studio will read all JSON files under `tokens/` and display them in the plugin panel.

### 3. Import as Figma Variables

Token Studio → Variables → **Export to Figma Variables**

This creates Variable Collections in Figma:
- `global/colors` → Color variables
- `global/typography` → Typography variables
- `global/spacing` → Spacing variables
- `semantic/semantic` → Semantic aliases (referencing global vars)

---

## Ongoing Workflow

When tokens change in this repo:
1. Open Token Studio in Figma
2. Click **Pull from GitHub** to get latest
3. Click **Export to Figma Variables** to update Variables

When Variables change in Figma:
1. Token Studio → Push to GitHub → creates a PR with updated JSON

---

## Figma MCP (Claude Code)

Once the Figma library is set up:

1. Share the Figma file URL with Claude Code
2. Claude reads designs via `get_design_context`
3. Claude maps Figma components to code via Code Connect
4. When generating code, Claude uses the token names from this repo (e.g. `var(--bc-semantic-brand)`, `text-[var(--bc-color-dark-blue)]`)

To set up Code Connect mappings, run from project root:
```bash
# Claude Code will call add_code_connect_map for each component
# See components/README.md for the component list
```

---

## Variable Collections Structure

```
Figma Variables
├── global/colors
│   ├── color/white       #ffffff
│   ├── color/darkBlue    #003574
│   ├── color/blue        #0071c7
│   ├── color/lightBlue   #23bced
│   └── ...
├── global/spacing
│   ├── spacing/xs        10px
│   ├── spacing/sm        20px
│   └── ...
└── semantic/semantic
    ├── semantic/bg        → color/white
    ├── semantic/text      → color/darkBlue
    ├── semantic/brand     → color/blue
    └── ...
```
