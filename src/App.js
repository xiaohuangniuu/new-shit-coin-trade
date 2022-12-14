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
import MergePage from './pages/merge';
import AirdropPage from './pages/airdrop';
import ReverseBotPage from "./pages/reverse_bot"
import SendToken from "./pages/sendToken"
import Monitor from "./pages/monitor"

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Router>
        <ScrollToTop/>
        <Switch>
          {/*<Route exact path="/" component={IndexPage} />*/}
          <Route exact path="/" component={GeneratePage} />
          <Route exact path="/bot" component={BotPage} />
          <Route exact path="/reverse_bot" component={ReverseBotPage} />
          <Route exact path="/merge" component={MergePage} />
          <Route exact path="/airdrop" component={AirdropPage} />
          <Route exact path="/send_token" component={SendToken} />
          <Route exact path="/monitor" component={Monitor} />
        </Switch>
      </Router>
    </ChakraProvider>
  );
}

export default App;
