const React = require('react');
const { useContext, useMemo, useState, useEffect } = React;

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

  const Connect = (props) => {
    const store = useContext(StoreContext);
    const [state, setState] = useState(() => store.select(keysToWatch));
    
    useEffect(() => {
      const unsubscribe = store.subscribeToSelectors(keysToWatch, () => {
        const newState = store.select(keysToWatch);
        setState(newState);
      });
      
      return unsubscribe;
    }, [store, keysToWatch.join()]);

    const actions = useMemo(() => {
      const actionMap = {};
      actionCreators.forEach((name) => {
        actionMap[name] = (...args) => {
          if (store.action) {
            return store.action(name, args);
          }
          return store[name](...args);
        };
      });
      return actionMap;
    }, [store, actionCreators.join()]);
    
    return React.createElement(Comp, {
      ...props,
      ...state,
      ...actions,
    });
  };

  Connect.displayName = `Connect(${Comp.displayName || Comp.name})`;
  return Connect;
};

exports.Provider = Provider;
exports.connect = connect;