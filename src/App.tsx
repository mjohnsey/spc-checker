/* eslint-disable react/jsx-props-no-spreading */
import React, {
  useState,
  useEffect,
  useMemo,
  ReactNode,
  useCallback,
} from "react";
import { styled, createTheme, ThemeProvider } from "@mui/material/styles";
import Box from "@mui/material/Box";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import Container from "@mui/material/Container";
import CssBaseline from "@mui/material/CssBaseline";
import MapIcon from "@mui/icons-material/Map";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuIcon from "@mui/icons-material/Menu";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import MuiDrawer from "@mui/material/Drawer";
import Paper from "@mui/material/Paper";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import MapGL, { Source, Layer, LayerProps } from "react-map-gl";
import * as _ from "lodash";
import { MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { Outlook, SevereWeatherTypes } from "@mjohnsey/weather.js";

const MAPBOX_TOKEN =
  "pk.eyJ1IjoibWpvaG5zZXkiLCJhIjoiY2t1aXdmZ2c4MnJ6NDJxbnpzcDIxdXFsZiJ9.6o6cmSKcdhnCRqbPlpcVkQ";

export const mainListItems = (
  <div>
    <ListItem button>
      <ListItemIcon>
        <MapIcon />
      </ListItemIcon>
      <ListItemText primary="Map" />
    </ListItem>
  </div>
);

function Copyright() {
  return (
    <Typography variant="body2" color="text.secondary" align="center">
      {"Copyright © "}
      <Link color="inherit" href="https://github.com/mjohnsey/spc-checker">
        Michael Johnsey
      </Link>{" "}
      {new Date().getFullYear()}
    </Typography>
  );
}

const drawerWidth = 200;

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

class HoverInfo {
  public x: number;

  public y: number;

  public severeType: string;

  constructor(x: number, y: number, severeType: string) {
    this.x = x;
    this.y = y;
    this.severeType = severeType;
  }
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})<AppBarProps>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  "& .MuiDrawer-paper": {
    position: "relative",
    whiteSpace: "nowrap",
    width: drawerWidth,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    boxSizing: "border-box",
    ...(!open && {
      overflowX: "hidden",
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      width: theme.spacing(7),
      [theme.breakpoints.up("sm")]: {
        width: theme.spacing(9),
      },
    }),
  },
}));

const mdTheme = createTheme();

enum SpcColors {
  SLGT = "yellow",
  MRGL = "green",
  TSTM = "#90EE90",
}

const relevantOutlooks = _.filter(Outlook.getOutlooks(), (outlook) => {
  if (outlook.day === 1 || outlook.day === 2) {
    if (outlook.outlookType.weatherType === SevereWeatherTypes.GENERAL) {
      return true;
    }
  }
  return false;
});

const spcLayers = _.map(relevantOutlooks, (outlook) => ({
  id: outlook.id(),
  name: outlook.name(),
  geoJsonUrl: `https://spc-checker-api.mjohnsey.workers.dev/proxiedFetch/${outlook.id()}`,
  webUrl: outlook.webUrl(),
}));

function DashboardContent() {
  const [open, setOpen] = React.useState(false);
  const toggleDrawer = () => {
    setOpen(!open);
  };

  const [allData, setAllData] = useState("");
  const [viewport, setViewport] = useState({
    latitude: 36.3,
    longitude: -92.2,
    zoom: 3,
    bearing: 0,
    pitch: 0,
    width: "1100px",
    height: "700px",
  });
  const [selectedLayerId, setSelectedLayerId] = useState(spcLayers[0].id);
  const [selectedLayer, setSelectedLayer] = useState(
    spcLayers[_.findIndex(spcLayers, { id: selectedLayerId })]
  );
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);

  useEffect(() => {
    fetch(selectedLayer.geoJsonUrl)
      .then((resp) => resp.json())
      .then((json) => setAllData(json));
  }, [selectedLayer]);

  useEffect(() => {
    setSelectedLayer(
      spcLayers[_.findIndex(spcLayers, { id: selectedLayerId })]
    );
  });

  const handleLayerChange = (
    event: SelectChangeEvent<string>,
    child: ReactNode
  ) => {
    setSelectedLayerId(event.target.value);
  };

  const onHover = useCallback((event) => {
    const {
      features,
      srcEvent: { offsetX, offsetY },
    } = event;
    const hoveredFeature = features && features[0];
    if (hoveredFeature) {
      const { properties } = hoveredFeature;
      const { LABEL } = properties;
      let severeType = "Other";
      if (LABEL) {
        severeType = LABEL;
      }
      setHoverInfo(new HoverInfo(offsetX, offsetY, severeType));
    } else {
      setHoverInfo(null);
    }
  }, []);

  const onClick = useCallback((event) => {
    const feature = event.features && event.features[0];
    if (feature) {
      window.open(selectedLayer.webUrl, "_blank");
    }
  }, []);

  const data = useMemo(() => allData, [allData]);

  const dataLayer: LayerProps = {
    id: "data",
    type: "fill",
    paint: {
      "fill-color": [
        "match",
        ["get", "LABEL"],
        "MDT",
        "red",
        "HIGH",
        "pink",
        "ENH",
        "orange",
        "SLGT",
        SpcColors.SLGT,
        "MRGL",
        SpcColors.MRGL,
        SpcColors.TSTM,
      ],
      "fill-opacity": 0.8,
    },
  };

  return (
    <ThemeProvider theme={mdTheme}>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <AppBar position="absolute" open={open}>
          <Toolbar
            sx={{
              pr: "24px", // keep right padding when drawer closed
            }}
          >
            <IconButton
              edge="start"
              color="inherit"
              aria-label="open drawer"
              onClick={toggleDrawer}
              sx={{
                marginRight: "36px",
                ...(open && { display: "none" }),
              }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              component="h1"
              variant="h6"
              color="inherit"
              noWrap
              sx={{ flexGrow: 1 }}
            >
              SPC Checker
            </Typography>
          </Toolbar>
        </AppBar>
        <Drawer variant="permanent" open={open}>
          <Toolbar
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              px: [1],
            }}
          >
            <IconButton onClick={toggleDrawer}>
              <ChevronLeftIcon />
            </IconButton>
          </Toolbar>
          <Divider />
          <List>{mainListItems}</List>
        </Drawer>
        <Box
          component="main"
          sx={{
            backgroundColor: (theme) =>
              theme.palette.mode === "light"
                ? theme.palette.grey[100]
                : theme.palette.grey[900],
            flexGrow: 1,
            height: "100vh",
            overflow: "auto",
          }}
        >
          <Toolbar />
          <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
              <Grid item xl={12}>
                <Select value={selectedLayerId} onChange={handleLayerChange}>
                  {spcLayers.map((layer) => (
                    <MenuItem key={layer.id} value={layer.id}>
                      {_.startCase(_.lowerCase(layer.name))}
                    </MenuItem>
                  ))}
                </Select>
                <Paper sx={{ p: 2, display: "flex", flexDirection: "column" }}>
                  <MapGL
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...viewport}
                    mapStyle="mapbox://styles/mapbox/streets-v11"
                    onViewportChange={setViewport}
                    mapboxApiAccessToken={MAPBOX_TOKEN}
                    interactiveLayerIds={["data"]}
                    onHover={onHover}
                    onClick={onClick}
                  >
                    <Source type="geojson" data={data}>
                      <Layer {...dataLayer} />
                    </Source>
                    {hoverInfo !== null && hoverInfo.severeType && (
                      <div
                        className="tooltip"
                        style={{
                          left: hoverInfo.x,
                          top: hoverInfo.y,
                          position: "absolute",
                          margin: "8px",
                          padding: "4px",
                          background: "rgba(0, 0, 0, 0.8)",
                          color: "#fff",
                          maxWidth: "300px",
                          fontSize: "10px",
                          zIndex: 9,
                          pointerEvents: "none",
                        }}
                      >
                        <div>{hoverInfo.severeType}</div>
                      </div>
                    )}
                  </MapGL>
                </Paper>
              </Grid>
            </Grid>
            <Copyright />
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

function App(): JSX.Element {
  return (
    <div className="App">
      <DashboardContent />
    </div>
  );
}

export default App;
