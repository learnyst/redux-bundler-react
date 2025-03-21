const React = require('react');

const StoreContext = React.createContext();

class Provider extends React.Component {
  render() {
    return (
      <StoreContext.Provider value={this.props.store}>
        {React.Children.only(this.props.children)}
      </StoreContext.Provider>
    );
  }
}

const connect = function (...args) {
  const Comp = args.slice(-1)[0];
  const strings = args.length > 1 ? args.slice(0, -1) : [];
  const actionCreators = [];
  const keysToWatch = [];
  
  strings.forEach((str) => {
    if (str.startsWith('select')) {
      keysToWatch.push(str);
    } else if (str.startsWith('do')) {
      actionCreators.push(str);
    } else {
      throw new Error(`CanNotConnect ${str}`);
    }
  });

  class Connect extends React.Component {
    static contextType = StoreContext;

    constructor(props, context) {
      super(props, context);
      const store = this.context;
      this.state = store.select(keysToWatch);
      this.unsubscribe = store.subscribeToSelectors(keysToWatch, this.setState.bind(this));
      
      this.actionCreators = {};
      actionCreators.forEach((name) => {
        this.actionCreators[name] = (...args) => {
          if (store.action) {
            return store.action(name, args);
          }
          return store[name](...args);
        };
      });
    }

    componentWillUnmount() {
      this.unsubscribe();
    }

    render() {
      return React.createElement(
        Comp,
        {
          ...this.props,
          ...this.state,
          ...this.actionCreators,
          ref: this.props.refToForward,
        }
      );
    }
  }

  Connect.displayName = `Connect(${Comp.displayName || Comp.name})`;
  return Connect;
};

exports.Provider = Provider;
exports.connect = connect;