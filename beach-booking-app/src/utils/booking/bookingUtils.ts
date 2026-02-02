// Utility functions for booking logic
export const getTeamColors = (team: "A" | "B" | null) => {
  if (team === "A") {
    return {
      primary: "#2196F3",
      gradient: ["#2196F3", "#1976D2", "#1565C0"],
      light: "#E3F2FD",
      text: "white"
    };
  } else if (team === "B") {
    return {
      primary: "#F44336",
      gradient: ["#F44336", "#E53935", "#D32F2F"],
      light: "#FFEBEE",
      text: "white"
    };
  }
  return {
    primary: "#667eea",
    gradient: ["#667eea", "#764ba2"],
    light: "#f0f2f5",
    text: "white"
  };
};

export const getTeamIcon = (team: "A" | "B" | null) => {
  return team === "A" ? "people" : team === "B" ? "people" : "person-add";
};