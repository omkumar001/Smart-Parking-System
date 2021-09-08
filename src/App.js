import {createMuiTheme, ThemeProvider} from '@material-ui/core';
import './App.css';
import NavBar from './components/NavBar';
import CustomCard from './components/CustomCard';

const theme = createMuiTheme({
  palette: {
    primary: {
      main:"#2e1667",
    },
    secondary: {
      main:"#c7d8ed",
    },
  },
  typography: {
    fontFamily: [
      'Roboto'
    ],
    h4: {
      fontWeight: 600,
      fontSize: 28,
      lineHeight: '2rem',
      },
    h5: {
      fontWeight: 100,
      lineHeight: '2rem',
    },
  },
});

function App() {
  return (
    <div className="App">
      <ThemeProvider theme={theme}>

        <NavBar/>
        <CustomCard
          title="Parking for your car"
          imgUrl="https://strapi.parkplus.io/uploads/illustration_group_46353f31ed.png"
          details="Begin your car journey with ParkUp and say goodbye to all your parking related worries - one service at a time"
        />
      </ThemeProvider>
    </div>
  );
}

export default App;
