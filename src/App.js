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
import DetailPage from './pages/detail';
import IndexPage from './pages/Index';

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Router>
        <ScrollToTop/>
        <Switch>
          {/*<Route exact path="/" component={IndexPage} />*/}
          <Route exact path="/" component={DetailPage} />
        </Switch>
      </Router>
    </ChakraProvider>
  );
}

export default App;
