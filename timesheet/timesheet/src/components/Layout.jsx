import React, { useState } from "react";
import { Box, AppBar, Toolbar, Typography } from "@mui/material";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

const drawerWidth = 240;

export default function Layout() {
  const [pageTitle, setPageTitle] = useState("Timesheets");

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          ml: `${drawerWidth}px`,
          width: `calc(100% - ${drawerWidth}px)`
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            {pageTitle}
          </Typography>
        </Toolbar>
      </AppBar>

      <Sidebar onSelect={setPageTitle} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: (theme) => theme.mixins.toolbar.minHeight + 8,
          width: `calc(100% - ${drawerWidth}px)`
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
