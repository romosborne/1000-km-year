import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter } from "react-router-dom";
import { CookiesProvider } from "react-cookie";
import { MantineProvider } from "@mantine/core";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <CookiesProvider>
        <MantineProvider
          withGlobalStyles
          withNormalizeCSS
          theme={{
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
      </CookiesProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

serviceWorkerRegistration.register();
