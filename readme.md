# Speedux

[![npm version](https://img.shields.io/npm/v/speedux.svg?style=flat-square)](https://www.npmjs.com/package/speedux)
[![License](https://img.shields.io/npm/l/speedux.svg)](https://www.npmjs.com/package/speedux)
[![npm downloads](https://img.shields.io/npm/dm/speedux.svg?style=flat-square)](https://www.npmjs.com/package/speedux)
[![build status](https://img.shields.io/travis/teefouad/speedux/master.svg?style=flat-square)](https://travis-ci.org/teefouad/speedux) 

An opinionated library for managing state in React apps, based on Redux.

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

[Todos App](https://codesandbox.io/s/speedux-demo-todos-88ouj)  
[Shopping Cart App](https://codesandbox.io/s/speedux-demo-shop-7hupq)

&nbsp;
&nbsp;

# Quick Tutorial

Using Speedux is pretty easy and straight-forward. First step is to wrap your application in a `Provider` component and the second step is to use the [`connect`](#connectcomponent-configuration) function to connect your components to the store. Normal Redux stuff but with less code.

To understand how it works, let's take an example of a very simple counter app that displays three buttons. One button increases the count on click, another button decreases the count and a third button would reset the count.

### 1. Wrap your app
Start with the application entry file, it's usually the _src/index.js_ file (assuming create-react-app). You would only need to import the `Provider` component from Speedux and wrap your application with it.

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

That's pretty much all you need to do here.

### 2. Connect your component

Next step will be inside your component file. Import the [`connect`](#connectcomponent-configuration) function from Speedux and pass it two parameters, the first parameter is your component definition and the second parameter is a [configuration object](#the-configuration-object) that defines the initial state for your connected component and all the logic required to update it.

We want the `Counter` component state to contain a `count` property with an initial value of zero. To update the `count` property, we will use three actions: `increaseCount`, `decreaseCount` and `resetCount`.

```jsx
import React from 'react';
import { connect } from 'speedux'; 

const Counter = ({ state, actions }) => (
  <div>
    <h1>Count is: { state.count }</h1>

    <button onClick={actions.increaseCount}>
      Increase count
    </button>

    <button onClick={actions.decreaseCount}>
      Decrease count
    </button>

    <button onClick={actions.resetCount}>
      Reset count
    </button>
  </div>
);

export default connect(Counter, {
  name: 'counter',
  
  state: { count: 0 },
  
  actions: {
    increaseCount() {
      return { count: this.getState('count') + 1 };
    },
    decreaseCount() {
      return { count: this.getState('count') - 1 };
    },
    resetCount() {
      return { count: 0 };
    },
  },
});
```

That's it! You have a fully working counter component that is connected to the Redux store.

The [`connect`](#connectcomponent-configuration) function automatically injected the `state` and `actions` props into the component props.

This was a very simple example to get you started. Next, you can learn more about the [configuration object](#the-configuration-object) or keep reading to learn how to create asyncronous actions and listen to actions dispatched by other components.

&nbsp;
&nbsp;

# Asyncronous Actions

In a real world application, you might need to fetch data from a remote source and update the UI accordingly. For such cases, you can use an asyncronous action. To create an asyncronous action, simply use a generator function instead of a normal function.

Whenever your generator function yields an object, that object will be used to [update the component state](#updating-the-state) in the Redux store. If your generator function yields a Promise object, the function execution will pause until that promise is resolved and the result will be passed to the generator function on the next call.

 Here is an example:

```jsx
const config = {
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
};
```

&nbsp;
&nbsp;

# Handling Errors

To handle errors in an asyncronous action, you can check if the resolved response is an instance of `Error`:

```jsx
const config = {
  name: 'faultyDataFetcher',

  state: {
    loading: false,
    data: null,
    error: null,
  },

  actions: {
    * fetchData() {
      // Yield an object to update the state and indicate that
      // the data is being loaded. You can use `props.state.loading`
      // to display a spinner or something similar.
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
};
```

You can also use the handy function `this.isError(response)` instead of `response instanceof Error`.

&nbsp;
&nbsp;

# Listening to Actions

You can use the [`handlers`](#handlers-object) configuration option to listen to any action dispatched by the Redux store.

Simply, use the action type as the key and the handler function as the value. The handler function will always receive the action object as a single parameter and should return an object that specifies the [state keys that need to be updated](#updating-the-state) and their new values.

Here is an example:

```jsx
const config = {
  name: 'routerSpy',

  state: { currentPath: null },

  handlers: {
    '@@router/LOCATION_CHANGE': (action) => {
      return {
        currentPath: action.payload.location.pathname,
      };
    },
  },
};
```

You can also listen to [actions](#actions-object) that were defined in a [`configuration object`](#the-configuration-object) of another connected component.

For example, if we have a connected component `Foo`:
```jsx
export default connect(Foo, {
  name: 'foo',

  actions: {
    saySomething(message) { ... }
  },
  ...
});
```

And another connected component `Baz` that needs to listen to action `saySomething` which would be dispatched by component `Foo`:
```jsx
export default connect(Baz, {
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

The [`connect`](#connectcomponent-configuration) function automatically injects a `dispatch` function into the component props. You can use the `dispatch` function to dispatch any action and specify its payload as well.

Here is an example:

```jsx
import React from 'react';
import { connect } from 'speedux';

const MyComponent = ({ dispatch }) => {
  // dispatches an action with type 'someAction' and an empty object
  // as the payload
  function onClickButtonA() {
    dispatch('someAction');
  }
  
  // dispatches an action with type 'something' with the specified
  // object as the payload
  function onClickButtonB() {
    dispatch('someAction', { value: 'abc' });
  }
  
  return (
    <div>
      <button onClick={onClickButtonA}>
        Button A
      </button>

      <button onClick={onClickButtonB}>
        Button B
      </button>
    </div>
  );
};

export default connect(MyComponent, {...});
```

You can also dispatch [actions](#actions-object) that were defined in a [configuration object](#the-configuration-object) of another connected component.

For example, let's say that we have a component `Profile` that displays the availability of a user:
```jsx
export default connect(Profile, {
  name: 'userProfile',

  state: {
    userStatus: 'online',  
  },

  actions: {
    setUserStatus(userStatus) {
      return { userStatus };
    },
  },
  ...
})
```

And another component `Baz` that needs to trigger the `setUserStatus` action which is defined in the configuration object of component `Profile`:
```jsx

const Baz = ({ dispatch }) => {
  function setStatus(status) {
    dispatch('userProfile.setUserStatus', { userStatus: status });
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

export default connect(Baz, {...})
```

Note that the payload object keys must match the argument names of the action function that was defined in the configuration object.

&nbsp;
&nbsp;

# Updating the State

Both [action](#actions-object) and [handler](#handlers-object) functions define how the state should be updated by returning an object. This object specifies the state keys that need to be updated and their new values. In the following example, `changeFoo` will only update `foo` in the state with value `Bingo` while `fiz` will remain the same.

```jsx
const MyComponent = ({ state, actions }) => {
  // Before clicking the button: { foo: 'baz', fiz: 'boo' }
  // After clicking the button: { foo: 'Bingo', fiz: 'boo' }
  console.log(state);
  
  return (
    <div>
      <button onClick={actions.changeFoo}>
        Click me
      </button>
    </div>
  );
};

export default connect(MyComponent, {
  name: 'myComponent',

  state: {
    foo: 'baz',
    fiz: 'boo',
  },

  actions: {
    changeFoo() {
      return { foo: 'Bingo' };
    }
  }
});
```

### Nested State Keys
To update deeply nested state keys, you can use dot notation as a string:

```jsx
export default connect(MyComponent, {
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
export default createModule('foo', {
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

You can also use a wildcard for reading the state as well:

```jsx
export default connect(MyComponent, {
  name: 'myComponent',

  state: {
    list: [
      { name: 'feeb' },
      { name: 'foo' },
      { name: 'fiz' },
    ],
  },
  
  actions: {
    logAllNames() {
      const names = this.getState('list.*.name');
      console.log(names); // ['feeb', 'foo', 'fiz']
    },
  },
});
```

### Mapper Function

If you need to dynamically calculate the new value of the state key based on the old value, use a mapper function:

```jsx
export default createModule('foo', {
  state: {
    list: [
      { count: 151 },
      { count: 120 },
      { count: 2 },
    ],
  },
  
  actions: {
    setMinimum() {
      return {
        'list.*.count': (oldValue) => {
          if (oldValue < 50) return 50;
          return oldValue;
        },
      };
    },
  },
});

/*
Invoking action setMinimum() will modify the state to:
{
  list: [
    { count: 151 },
    { count: 120 },
    { count: 50 },
  ],
}
*/
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

### connect(component, configuration)

| Parameter | Type | Description |
| :----- | :----- | :----- |
| component | Class \| Function | Reference to the class/function of the component to be connected to the store. |
| configuration | Object | The [configuration object](#the-configuration-object) for the component. |

The connect function connects a component to the Redux store and automatically injects four properties into the component props. These properties are `state`, `actions`, `globalState` and `dispatch`.

The `state` prop represents the component state in the Redux store. The default value for the state is an empty object.

The `actions` prop is a list of action dispatcher functions that correspond to the [actions](#actions-object) that were defined in [the configuration object](#the-configuration-object). The default value for the actions prop is an empty object.

The `globalState` prop represents [the states of other connected components](#globalstate-object). The default value for the global state is an empty object.

The `dispatch` prop represents a [function](#dispatchactiontype-payload) that can be used to [dispatch any action](#dispatching-actions).

##### Example:
```jsx
import React from 'react';
import { connect } from 'speedux';

const MyComponent = ({ state, actions, globalState, dispatch }) => {
  console.log(state); // { value: 'abc' }
  console.log(actions); // { setValue: function(newValue) {...} }
  console.log(globalState); // { foo: 'someValue' }
  console.log(dispatch); // Function

  return <div>...</div>;
};

export default connect(MyComponent, {
  name: 'myComponent',

  state: {
    value: 'abc',
  },

  globalState: {
    foo: 'fooComponent.some.value'
  },

  actions: {
    setValue(newValue) {
      return { value: newValue };
    },
  },
});
```

&nbsp;

### useReducer(key, reducer)

Allows registering a reducer function that can listen to any action dispatched by the store.

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

### dispatch(actionType, payload)

The `dispatch` function is automatically injected into the props of a connected component and lets you dispatch any action and specify the action payload as well.

| Parameter | Type | Description |
| :----- | :----- | :----- |
| actionType | String | Type of the action to be dispatched. |
| payload | Object | Action payload object. |

See [Dispatching Actions](#dispatching-actions) for an example.


&nbsp;


### getState(query)

This method is only available in the context of [action](#actions-object) and [handler](#handlers-object) functions and returns the Redux state object of the connected component or part of it based on a given query.

If the query parameter is in dot notation as a string, it will return the resolved value of the given key path. If the query is an object, it will return an object that has the same structure but contains the resolved values. If the query parameter is not provided, the complete state object will be returned.

| Parameter | Type | Description |
| :----- | :----- | :----- |
| query | String \| Object | A query string or a query object that represents part of the state object that needs to be fetched. This parameter is not required. |

##### Example:
```javascript
export default connect(MyComponent, {
  name: 'foo',

  state: {
    count: 0,
    data: {
      items: [
        { title: 'Item one' },
        { title: 'Item two' },
        { title: 'Item three' },
      ],
      atts: {
        tags: [ 'js', 'react', 'redux' ],
      }
    },
  },

  actions: {
    logData() {
      // a simple query string
      console.log(this.getState('count')); // 0

      // query string that uses dot notation
      console.log(this.getState('data.items[1].title')); // Item two
      console.log(this.getState('data.atts.tags').length); // 3
      console.log(this.getState('data.atts.tags[2]')); // redux

      // query object
      const state = this.getState({
          thirdItemTitle: 'data.items[2].title',
          secondTag: 'data.atts.tags[2]',
      });
      console.log(state); // { thirdItemTitle: 'Item three', secondTag: 'react' }

      // complete state object
      console.log(this.getState());
    },
  },
});
```

&nbsp;
&nbsp;

# The Configuration Object

The configuration object may contain one or more of the following keys:

### name (String)

The `name` key is the only required key in the configuration object. It *must* be unique for each component as it is used to identify the Redux state and actions for the component.

### state (Object)
Represents the component state (or initial state) in the Redux store. If not provided, an empty object will be used as the component initial state.

The component state can only be updated by returning objects from action or handler functions. (explained below)

### actions (Object)
A list of all the actions that may need to be dispatched from the component to update the state. Provide the action name as the key and the function as the value.

The key or function name will be used to generate the action type. For example, a name `calculator` with a defined action `addNumbers` will dispatch an action of type `@@calculator/ADD_NUMBERS` whenever `props.actions.addNumbers()` is called.

The function should return an object that specifies the state keys that need to be updated and their new values.

```jsx
const config = {
  name: 'calculator',

  state: {
    result: 0,
  },

  actions: {
    addNumbers(x, y) {
      return { result: x + y };
    }
  }
};
```

To create an asyncronous action, simply use a generator function instead of a normal function.

Whenever your generator function yields an object, that object will be used to update the component state in the Redux store. If your generator function yields a Promise object, the function execution will pause until that promise is resolved and the result will be passed to the generator function on the next call.

See [Asyncronous Actions](#asyncronous-actions) for examples.

### handlers (Object)
A list of all the actions that the component needs to listen to and update its state accordingly. Provide the action type as the key and the handler function as the value. You can listen to actions dispatched by other components or any action dispatched by the Redux store.

The handler function will always receive the action object as a single parameter and should return an object that specifies the state keys that need to be updated and their new values.

See [Listening to Actions](#listening-to-actions) for examples.

### globalState (Object)
The `globalState` key allows reading states of other connected components. Simply provide an object with the name as the key and the state query as the value.

For example, if we have a connected component `Cart`:
```jsx
export default connect(Cart, {
  name: 'shoppingCart',

  state: {
    items: [
      { id: 123, price: 12 },
      { id: 456, price: 34 },
      { id: 789, price: 56 },
    ],
    totalCost: 102,
    discountCode: 'u324y32',
  },
  ...
});
```

And another connected component `Checkout` that needs to read items inside the state of the `Cart` component:

```jsx

const Checkout = ({ globalState }) => {
  console.log(globalState.cartItems); // [{...}, {...}, {...}]
  console.log(globalState.cartItemPrices); // [12, 34, 56]
  ...
};

export default connect(Checkout, {
  name: 'checkout',
  
  globalState: {
    cartItems: 'shoppingCart.items',
    cartItemPrices: 'shoppingCart.items.*.price',
  },
  ...
});
```

### stateKey (String)
The `stateKey` is used as a property name when the related Redux state object is injected into the component props. The default value is 'state'.

### actionsKey (String)
The `actionsKey` is used as a property name when the action creator functions object is injected into the component props. The default value is 'actions'.

### globalStateKey (String)
The `globalStateKey` is used as a property name when other component states are injected into the component props. The default value is 'globalState'.

### dispatchKey (String)
The `dispatchKey` is used as a property name when the `dispatch` function is injected into the component props. The default value is 'dispatch'.

&nbsp;
&nbsp;

# License

MIT
