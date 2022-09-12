import {
  ColorScheme,
  ColorSchemeProvider,
  MantineProvider,
} from "@mantine/core";
import { useState } from "react";
import { CookiesProvider, useCookies } from "react-cookie";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

function AppWrapper() {
  const [cookies, setCookie, removeCookie] = useCookies(["colorScheme"]);
  const [colorScheme, setColorScheme] = useState<ColorScheme>(
    cookies.colorScheme ?? "light"
  );
  const toggleColorScheme = () => {
    const value = colorScheme === "light" ? "dark" : "light";
    console.log(`setting scheme to ${value}`);

    setColorScheme(value);
    setCookie("colorScheme", value);
  };

  return (
    <BrowserRouter>
      <CookiesProvider>
        <ColorSchemeProvider
          colorScheme={colorScheme}
          toggleColorScheme={toggleColorScheme}
        >
          <MantineProvider
            withGlobalStyles
            withNormalizeCSS
            theme={{
              colorScheme,
              defaultRadius: "lg",
              colors: {
                orange: [
                  "#F8F3EE",
                  "#EEDECC",
                  "#ECCAA6",
                  "#F1B97D",
                  "#FFA94D",
                  "#EA9841",
                  "#D48939",
                  "#B77B3B",
                  "#9A6E40",
                  "#826342",
                ],
              },
              primaryColor: "orange",
            }}
          >
            <App />
          </MantineProvider>
        </ColorSchemeProvider>
      </CookiesProvider>
    </BrowserRouter>
  );
}

export default AppWrapper;
