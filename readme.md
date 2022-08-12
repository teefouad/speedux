# Speedux

[![Version](https://img.shields.io/npm/v/speedux.svg?style=flat-square)](https://www.npmjs.com/package/speedux)
[![License](https://img.shields.io/npm/l/speedux.svg?style=flat-square)](https://www.npmjs.com/package/speedux)
[![Downloads](https://img.shields.io/npm/dm/speedux.svg?style=flat-square)](https://www.npmjs.com/package/speedux)
[![Build Status](https://img.shields.io/travis/teefouad/speedux/master.svg?style=flat-square)](https://travis-ci.org/teefouad/speedux) 
![Coveralls GitHub](https://img.shields.io/coveralls/github/teefouad/speedux.svg)

State management for React with Redux, made easier.

&nbsp;
&nbsp;

# Contents

- [Installation](#installation)  
- [Demos](#demos)  
- [Quick Tutorial](#quick-tutorial)  
- [Asyncronous Actions](#asyncronous-actions)   
- [Handling Errors](#handling-errors)  
- [Listening to Actions](#listening-to-actions)   
- [Dispatching Actions](#dispatching-actions)   
- [Updating the State](#updating-the-state)  
- [Middlewares](#middlewares)  
- [API](#api)  
- [The Configuration Object](#the-configuration-object)  
- [Typescript](#typescript)  
- [License](#license)

&nbsp;
&nbsp;

# Installation

**Install with npm**
```
npm install --save speedux
```

**Install with yarn**
```
yarn add speedux
```

&nbsp;
&nbsp;

# Demos

[Todos App](https://codesandbox.io/s/speedux-demo-todos-hfkd6)  
[Shopping Cart App](https://codesandbox.io/s/speedux-demo-shop-1b1ce)

&nbsp;
&nbsp;

# Quick Tutorial

Let's say you are building a simple counter that displays three buttons. One button increases the count when clicked, another button decreases the count and a third button would reset the count.

### 1. Wrap your app
Start by importing the `Provider` component from Speedux then wrap your application with it.

```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'speedux';

import Counter from './Counter';

const App = (
  <Provider>
    <Counter />
  </Provider>
);

ReactDOM.render(App, document.getElementById('root'));
```

### 2. Create global state

Next, create the global state that you need to use in your app.

```js
import { createGlobalState } from 'speedux';

createGlobalState({
  name: 'counter',

  state: {
    count: 0,
  },

  actions: {
    increaseCount: () => (prevState) => ({
      count: prevState.count + 1,
    }),
    decreaseCount: () => (prevState) => ({
      count: prevState.count - 1,
    }),
    resetCount: () => ({
      count: 0,
    }),
  },
});
```

The `createGlobalState` takes a configuration object which describes the global state and how it should be mutated using actions.

Each action (such as `resetCount`) should return an object that describes the changes that should be made to the global state.

If the global state change depends on the previous global state, return a function instead of an object. For example, consider actions `increaseCount` and `decreaseCount`.

### 3. Use global state in the UI

Finally, you can read the global state and dispatch actions from any component.

```jsx
import React from 'react';
import { useGlobalState, useActions } from 'speedux'; 

const Counter = () => {
  const counterState = useGlobalState('counter');
  const counterActions = useActions('counter');
  
  return (
    <div>
      <h1>Count is: { counterState.count }</h1>

      <button onClick={counterActions.increaseCount}>
        Increase count
      </button>

      <button onClick={counterActions.decreaseCount}>
        Decrease count
      </button>

      <button onClick={counterActions.resetCount}>
        Reset count
      </button>
    </div>
  );
};

export default Counter;
```

&nbsp;
&nbsp;

# Asyncronous Actions

In a real world application, you might need to fetch data from a remote source and update the UI accordingly. For such cases, you can use an asyncronous action. To create an asyncronous action, simply use a generator function instead of a normal function.

Whenever your generator function yields an object, that object will be used to [update the component state](#updating-the-state) in the Redux store.

If your generator function yields a Promise object, the function execution will pause until that promise is resolved and the result will be passed to the generator function on the next call.

Here is an example:

```jsx
createGlobalState({
  name: 'dataFetcher',

  state: {
    loading: false,
    data: null,
  },

  actions: {
    * fetchData() {
      // Yield an object to update the state and indicate that
      // the data is being loaded. You can use `props.state.loading`
      // to display a spinner or something similar.
      yield { loading: true };
    
      // Yield a promise to fetch the data
      const response = yield fetch('/api/posts');
      // `fetch` resolves to a promise that needs to be resolved to json
      const data = yield response.json();
      
      // Finally, yield an object to populate the state with the
      // loaded data and indicate that the data has been loaded
      yield {
        loading: false,
        data,
      };
    },
  },
});
```

&nbsp;
&nbsp;

# Handling Errors

To handle errors in an asyncronous action, you can use `.catch()` or you can check if the resolved response is an instance of `Error`:

```jsx
createGlobalState({
  name: 'faultyDataFetcher',

  state: {
    loading: false,
    data: null,
    error: null,
  },

  actions: {
    /* Handle errors using `.catch()` */
    * fetchData() {
      // Yield an object to update the state and indicate that
      // the data is being loaded. You can use `props.state.loading`
      // to display a spinner or something similar.
      yield { loading: true };
      
      // Yield a promise to fetch the data
      const response = yield fetch('/api/posts').catch(e => {
        console.log('Failed to fetch data');

        // Optionally return a fallback value
        return { failed: true, posts: [] };
      });
      
      // Handle loading errors
      if (response.failed === true) {
        ...
      } else {
        ...
      }
    },

    /* Handle errors using `instanceof` */
    * fetchOtherData() {
      // Yield an object to update the state and indicate that
      // the data is being loaded.
      yield { loading: true };
      
      // Yield a promise to fetch the data
      const response = yield fetch('/api/posts');
      
      // Handle loading errors
      if (response instanceof Error) {
        yield { error: response.message };
      } else {
        ...
      }
    },
  },
});
```

&nbsp;
&nbsp;

# Listening to Actions

You can use the [`handlers`](#handlers-object) configuration option to listen to any action dispatched by the Redux store.

Simply, use the action type as the key and the handler function as the value. The handler function will always receive the action object as a single parameter and should return an object that specifies the [state keys that need to be updated](#updating-the-state) and their new values.

Here is an example:

```jsx
createGlobalState({
  name: 'routerSpy',

  state: { currentPath: null },

  handlers: {
    '@@router/LOCATION_CHANGE': (action) => {
      return {
        currentPath: action.payload.location.pathname,
      };
    },
  },
});
```

You can also listen to [actions](#actions-object) that were defined in a [`configuration object`](#the-configuration-object).

For example, if we have a global state `foo`:

```jsx
createGlobalState({
  name: 'foo',

  actions: {
    saySomething(message) { ... }
  },
  ...
});
```

And another global state `baz` that needs to listen to action `saySomething` which is defined in `foo`:

```jsx
createGlobalState({
  name: 'baz',

  state: {
    text: null,
  },

  handlers: {
    'foo.saySomething': function(action) {
      return {
        text: `Foo said: ${action.payload.message}!`
      };
    },
  },
  ...
});
```

&nbsp;
&nbsp;

# Dispatching Actions

You can use the `useDispatch` hook to create a dispatch function.

Here is an example:

```jsx
import { useDispatch } from 'speedux';

const MyComponent = () => {
  const dispatch = useDispatch();

  // Dispatches an action with type 'something'
  function onClickButton() {
    dispatch({
      type: 'someAction',
      payload: {
        value: 'abc',
      },
    });
  }
  
  return (
    <div>
      <button onClick={onClickButton}>
        Dispatch an action
      </button>
    </div>
  );
};
```

You can also dispatch [actions](#actions-object) that were defined in a [configuration object](#the-configuration-object).

For example, let's say that we have a global state `profile` that displays the availability of a user:

```jsx
createGlobalState({
  name: 'profile',

  state: {
    userStatus: 'online',  
  },

  actions: {
    setUserStatus(userStatus) {
      return { userStatus };
    },
  },
  ...
});
```

And you need to dispatch `setUserStatus` action from component `Baz`:

```jsx
import { useDispatch } from 'speedux';

const Baz = () => {
  const dispatch = useDispatch();

  function setStatus(status) {
    dispatch('profile.setUserStatus', status);
  }
  
  return (
    <div>
      <button onClick={() => setStatus('online')}>
        Appear Online
      </button>
      
      <button onClick={() => setStatus('offline')}>
        Appear Offline
      </button>
    </div>
  );
};
```

&nbsp;
&nbsp;

# Updating the State

Both [action](#actions-object) and [handler](#handlers-object) functions define how the state should be updated by returning an object. This object specifies the state keys that need to be updated and their new values. In the following example, `changeFirstName` will only update `firstName` in the state with value `Bingo` while `lastName` will remain the same.

```jsx
createGlobalState({
  name: 'foo',

  state: {
    firstName: 'baz',
    lastName: 'boo',
  },

  actions: {
    changeFirstName() {
      return { firstName: 'Bingo' };
    }
  }
});

const MyComponent = () => {
  const state = useGlobalState('foo');
  const actions = useActions('foo');

  // Before clicking the button: { firstName: 'baz', lastName: 'boo' }
  // After clicking the button: { firstName: 'Bingo', lastName: 'boo' }
  console.log(state);
  
  return (
    <div>
      <button onClick={actions.changeFirstName}>
        Click me
      </button>
    </div>
  );
};
```

### Nested State Keys
To update deeply nested state keys, you can use dot notation as a string:

```jsx
createGlobalState({
  name: 'myComponent',

  state: {
    data: {
      list: [
        { props: { name: 'feeb' } },
        { props: { name: 'foo' } },
        { props: { name: 'fiz' } },
      ],
    },
  },
  
  actions: {
    changeFooName(newName) {
      return { 'data.list[1].props.name': newName };
    },
  },
});
```

### Wildcard Character: *
If you would like to modify all items of an array or an object in the state, use a wildcard character:

```jsx
createGlobalState({
  name: 'foo',

  state: {
    list: [
      { name: 'feeb' },
      { name: 'foo' },
      { name: 'fiz' },
    ],
  },
  
  actions: {
    changeAllNames(newName) {
      return { 'list.*.name': newName };
    },
  },
});

/*
Invoking action changeAllNames('jane') will modify the state to:
{
  list: [
    { name: 'jane' },
    { name: 'jane' },
    { name: 'jane' },
  ],
}
*/
```

### Mapper Function

If you need to dynamically calculate the new value of the state key based on the old value, return a function instead of an object:

```jsx
createGlobalState({
  name: 'counter',

  state: {
    count: 0,
  },
  
  actions: {
    increaseCount: () => (prevState) => ({
      count: prevState.count + 1,
    }),
  },
});
```

&nbsp;
&nbsp;

# Middlewares

To use a middleware, import [`useMiddleware`](#usemiddlewaremiddleware) method and pass it the middleware function. You don't need to use `applyMiddleware` from Redux, this method will be called internally by Speedux.

Here is an example using React Router DOM (v5.1.2) and Connected React Router (v6.6.1):

```jsx
import { Provider, useReducer, useMiddleware } from 'speedux';
import { ConnectedRouter, connectRouter, routerMiddleware } from 'connected-react-router';
import { createBrowserHistory } from 'history';

const history = createBrowserHistory();

// connected-react-router requires its reducer to be mounted under 'router'
useReducer('router', connectRouter(history));
useMiddleware(routerMiddleware(history));

ReactDOM.render((
  <Provider>
    <ConnectedRouter history={history}>
      ...
    </ConnectedRouter>
  </Provider>
), document.getElementById('root'));
```

&nbsp;
&nbsp;

# API

### createGlobalState(configuration)

| Parameter | Type | Description |
| :----- | :----- | :----- |
| configuration | Object | The [configuration object](#the-configuration-object) for the global state. |

The `createGlobalState` function creates a global state in the Redux store using the specified configuration object.

##### Example:
```jsx
import { createGlobalState } from 'speedux';

createGlobalState({
  name: 'foo',

  state: {
    value: 'abc',
  },

  actions: {
    setValue(newValue) {
      return { value: newValue };
    },
  },
});
```

&nbsp;

### useGlobalState(name)

| Parameter | Type | Description |
| :----- | :----- | :----- |
| name | String | Name of the global state to retrieve. |

Once you have created a global state using `createGlobalState`, you can use `useGlobalState` hook in any component to retrieve that global state.

##### Example:
```jsx
import { useGlobalState } from 'speedux';

const MyComponent = () => {
  const state = useGlobalState('foo');
  return (...);
};
```

&nbsp;

### useActions(name)

| Parameter | Type | Description |
| :----- | :----- | :----- |
| name | String | Name of the global state to retrieve its actions. |

Once you have created a global state using `createGlobalState` and defined actions that mutate that global state, you can use `useActions` hook in any component to retrieve those actions.

##### Example:
```jsx
import { useActions } from 'speedux';

const MyComponent = () => {
  const actions = useActions('foo');
  return (
    <button onClick={() => actions.setValue('Hello world!')}>
      Click to set value
    </button>
  );
};
```

&nbsp;

### useDispatch()

You can use the `useDispatch` hook to create a [dispatch function](#dispatching-actions).

##### Example:
```jsx
import { useDispatch } from 'speedux';

const MyComponent = () => {
  const dispatch = useDispatch();
  return (
    <button onClick={() => dispatch({ type: 'SOME_ACTION' })}>
      Click to dispatch an action
    </button>
  );
};
```

&nbsp;

### useHandler(actionType, callback)

| Parameter | Type | Description |
| :----- | :----- | :----- |
| actionType | String | Type of the action to listen to. |
| callback | Function | Function to be called when that action is dispatched. |

You can use the `useHandler` hook to listen to any action dispatched by the Redux store.

##### Example:
```jsx
import { useHandler } from 'speedux';

const MyComponent = () => {
  useHandler('@@redux/INIT', () => {
    console.log('INIT action has been dispatched');
  });
  return (...);
};
```

&nbsp;

### useReducer(key, reducer)

Allows registering a reducer function that can listen to any action dispatched by the store and modify the global state accordingly.

| Parameter | Type | Description |
| :----- | :----- | :----- |
| key | String | A unique identifier key for the reducer. |
| reducer | Function | Reducer function to use. |

##### Example:
```jsx
import { useReducer } from 'speedux';
import { connectRouter } from 'connected-react-router';
import { createBrowserHistory } from 'history';

const history = createBrowserHistory();
const routerReducer = connectRouter(history);

useReducer('router', routerReducer);
```

&nbsp;

### useMiddleware(middleware)

Allows using middleware functions such as React Router middleware and others. You don't need to use `applyMiddleware` from Redux before passing the middleware to this function.

| Parameter | Type | Description |
| :----- | :----- | :----- |
| middleware | Function | Middleware function to use. |

##### Example:
```jsx
import { useMiddleware } from 'speedux';
import { routerMiddleware } from 'connected-react-router';
import { createBrowserHistory } from 'history';

const history = createBrowserHistory();

useMiddleware(routerMiddleware(history));
```

&nbsp;
&nbsp;

# The Configuration Object

The configuration object may contain one or more of the following keys:

### name (String) - required

The `name` key is the only required key in the configuration object. It *must* be unique for each global state as it is used to identify the global state in the Redux store.

### state (Object)
Represents the piece of global state (or initial state) in the Redux store. If not provided, an empty object will be used.

### actions (Object)
A list of all the actions that may need to be dispatched from the UI to update the state. Provide the action name as the key and the function as the value.

The key or function name will be used to generate the action type. For example, a name `calculator` with a defined action `addNumbers` will dispatch an action of type `@@calculator/ADD_NUMBERS` whenever `addNumbers()` is called.

The function should return an object that specifies the state keys that need to be updated and their new values.

```jsx
createGlobalState({
  name: 'calculator',

  state: {
    result: 0,
  },

  actions: {
    addNumbers(x, y) {
      return { result: x + y };
    }
  }
});
```

To create an asyncronous action, simply use a generator function instead of a normal function.

Whenever your generator function yields an object, that object will be used to update the component state in the Redux store.

If your generator function yields a Promise object, the function execution will pause until that promise is resolved and the result will be passed to the generator function on the next call.

See [Asyncronous Actions](#asyncronous-actions) for examples.

### handlers (Object)
A list of all the external actions that may affect the global state. Provide the action type as the key and the handler function as the value. You can listen to any action dispatched by the Redux store.

The handler function will always receive the action object as a single parameter and should return an object that specifies the state keys that need to be updated and their new values.

See [Listening to Actions](#listening-to-actions) for examples.

&nbsp;
&nbsp;

# Typescript

Inside `counter-state.ts`:

```js
import { createGlobalState } from 'speedux';

export interface CounterState {
  count: number;
}

export interface CounterActions {
  increaseCount: () => void;
  decreaseCount: () => void;
  setCount: (value: number) => void;
  fetchCount: () => Promise<void>;
}

export default createGlobalState<CounterState, CounterActions>({
  name: 'counter',

  state: {
    count: 0,
  },

  actions: {
    increaseCount: () => (prevState) => ({
      count: prevState.count + 1,
    }),
    decreaseCount: () => (prevState) => ({
      count: prevState.count - 1,
    }),
    setCount: (value) => ({
      count: value,
    }),
    fetchData: function* () {
      // Async action
      ...
    },
  },
});
```

Inside the component file:

```jsx
import React from 'react';
import { useGlobalState, useActions } from 'speedux';
import { CounterState, CounterActions } from './counter-state';

const Counter = () => {
  const counterState = useGlobalState<CounterState>('counter');
  const counterActions = useActions<CounterActions>('counter');
  
  return (
    <div>
      ...
    </div>
  );
};

export default Counter;
```

Alternatively, you can do this:

```jsx
import React from 'react';
import counterStateManager from './counter-state';

const Counter = () => {
  const counterState = counterStateManager.useState();
  const counterActions = counterStateManager.useActions();
  
  return (
    <div>
      ...
    </div>
  );
};

export default Counter;
```

&nbsp;
&nbsp;

# License

MIT
