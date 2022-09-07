import React from 'react';
import {
  ChakraProvider,
  theme,
} from '@chakra-ui/react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";
import ScrollToTop from './components/ScrollToTop';
import GeneratePage from './pages/generate';
import BotPage from './pages/bot';

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Router>
        <ScrollToTop/>
        <Switch>
          {/*<Route exact path="/" component={IndexPage} />*/}
          <Route exact path="/" component={GeneratePage} />
          <Route exact path="/bot" component={BotPage} />
        </Switch>
      </Router>
    </ChakraProvider>
  );
}

export default App;
