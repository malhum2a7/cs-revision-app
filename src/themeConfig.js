export const THEMES = {
  apple: {
    name: "Apple Notes",
    vars: {
      "--bg": "#bfd7e3",
      "--card": "#edfeff",
      "--muted": "#6B7280",
     "--accent": "#4ebbf5",  
    "--accent2": "#23546e",  
      "--text": "#0a2533"
    }
  },
  notion: {
    name: "Notion",
    vars: {
      "--bg": "#F8FAFC",
      "--card": "#FFFFFF",
      "--muted": "#6B7280",
      "--accent": "#595859",
    "--accent2": "#c27800", 
      "--text": "#0F172A"
    }
  },
  vscode: {
    name: "VSCode",
    vars: {
      "--bg": "#0F172A",
      "--card": "#0B1220",
      "--muted": "#9CA3AF",
     "--accent": "#7f5991",  
    "--accent2": "#598091",  
      "--text": "#E6EEF8"
    }
  },
  lobster: {
  name: "Lobster ",
  vars: {
    "--bg": "#000101",
    "--card": "rgba(20,20,22,0.92)",
    "--text": "#fff7ed",
    "--muted": "rgba(255,247,237,0.62)",
    "--accent": "#D78730",   // orange
    "--accent2": "#C93F36",  // red
  },
},
  exam: {
    name: "Exam Revision",
    vars: {
      "--bg": "#e8e8e8",
      "--card": "#312c40",
      "--muted": "#c3bed1",
    "--accent": "#296d91",   
    "--accent2": "#91294a",
      "--text": "#c3bed1"
    }
  }
};

export const THEME_KEYS = Object.keys(THEMES);
