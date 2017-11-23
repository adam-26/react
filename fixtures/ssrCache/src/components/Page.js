import React, {Component} from 'react';
import PropTypes from 'prop-types';

import './Page.css';

const autofocusedInputs = [
  <input key="0" autoFocus placeholder="Has auto focus" />,
  <input key="1" autoFocus placeholder="Has auto focus" />,
];

export default class Page extends Component {
  state = {active: false};

  // A template engine can use other methods to determine if a component should be cached
  // static getCacheKey = (props, ctx) => Page.displayName || Page.name;

  static propTypes = {
    minutes: PropTypes.number.isRequired
  };

  handleClick = e => {
    this.setState({active: true});
  };
  render() {
    const link = (
      <a className="bold" onClick={this.handleClick}>
        Click Here
      </a>
    );
    return (
      <div>
        <p suppressHydrationWarning={true}>A random number: {Math.random()}</p>
        <p suppressHydrationWarning={false}>Server minutes: {this.props.minutes}</p>
        <p>Autofocus on page load: {autofocusedInputs}</p>
        <p>{!this.state.active ? link : 'Thanks!'}</p>
        {this.state.active && <p>Autofocus on update: {autofocusedInputs}</p>}
      </div>
    );
  }
}
