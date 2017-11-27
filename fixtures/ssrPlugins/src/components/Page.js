import React, {Component} from 'react';
import PropTypes from 'prop-types';

import './Page.css';

const autofocusedInputs = [
  <input key="0" autoFocus placeholder="Has auto focus" />,
  <input key="1" autoFocus placeholder="Has auto focus" />,
];

export default class Page extends Component {
  state = {active: false};

  static propTypes = {
    minutes: PropTypes.number.isRequired,
    name: PropTypes.string
  };

  handleClick = e => {
    this.setState({active: true});
  };

  render() {
    const { minutes, name } = this.props;
    const link = (
      <a className="bold" onClick={this.handleClick}>
        Click Here
      </a>
    );
    return (
      <div>
        <h1>SSR Plugin Demo</h1>
        {typeof name ==='string' && <h2>Hello, {name}!</h2>}
        {typeof name ==='string' && <h3>Change the name using the QS param, this injects content to a cached template.</h3>}
        <h4>Cache is updated every minute</h4>
        <div>
          <p>Server minutes: {minutes}</p>
          <p>Autofocus on page load: {autofocusedInputs}</p>
          <p>{!this.state.active ? link : 'Thanks!'}</p>
          {this.state.active && <p>Autofocus on update: {autofocusedInputs}</p>}
          <p>See the nodejs console for render timing information.</p>
        </div>
      </div>
    );
  }
}
