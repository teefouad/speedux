# Speedux for Redux

Speedux is an opinionated library that allows you to create actions and reducers for Redux, automatically. Speedux reduces the amount of code that needs to be written in a Redux application giving you peace of mind and more time to code the important stuff.

[![build status](https://img.shields.io/travis/teefouad/speedux/master.svg?style=flat-square)](https://travis-ci.org/teefouad/speedux) 
[![npm version](https://img.shields.io/npm/v/speedux.svg?style=flat-square)](https://www.npmjs.com/package/speedux)
[![npm downloads](https://img.shields.io/npm/dm/speedux.svg?style=flat-square)](https://www.npmjs.com/package/speedux)

&nbsp;

**Install via npm**

```
npm install --save speedux
```

&nbsp;

**Try it on CodeSandbox**

[![Edit rrjqo6lz64](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/rrjqo6lz64)

&nbsp;

&nbsp;

# Motivation
When you create a React application that uses Redux for state management, you would setup a store and combine all reducers in your app to create a single root reducer. You would also be creating so many files for each stateful component, one for the action types, another for the action creators and another for the reducer and so on. Not to mention that you'd need to map the related state and the action creators to the props of each stateful component. 

This is tedious and repetitive work and that is never a good thing because it increases your chances of making mistakes and creating bugs.

With Speedux you don't have to do any of this. Behind the scenes, Speedux will take care of all of this so you can relax and focus on writing the bytes that Make the World a Better Place ™. 

&nbsp;

&nbsp;

# How to Use

### 1. Entry file

This is usually the _src/index.js_ file (assuming create-react-app).
You would only need to import the `store` from Speedux and pass it to the `Provider`.

```javascript
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { store } from 'speedux';

import Main from './Main';

const App = (
  <Provider store={store}>
    <Main />
  </Provider>
);

// render your app
render(App, document.getElementById('root'));
```

&nbsp;

### 2. Component file

Inside your stateful component file, you would need to:

1. Import the `connect` function from Speedux. You will use it to connect your component to the store.
2. Import the module file related to this component (we will create it in a second).
3. Pass the component class/function and the module object to the `connect` function and export the returned component.

```javascript
import React from 'react';
import { connect } from 'speedux';

import module from './module';

const MainPage = props => (
  <div>
    <button onClick={() => props.actions.demo.increaseCount(10)}>
      Click me to increase count: {props.demo.count}
    </button>
    
    <button onClick={() => props.actions.demo.changeName('New value')}>
      Click me to change name: {props.demo.name}
    </button>
    
    <button onClick={() => props.actions.demo.fetchData()}>
      Click me to fetch data
    </button>
    
    <p>{ props.demo.loading ? 'Loading...' : props.demo.data }</p>
  </div>
);

export default connect(MainPage, module);
```

&nbsp;

### 3. Module file

The module file contains the initial state for the component and contains all the logic required to update it. Here is a sample module file that works with the component above:

```javascript
// start by importing createModule from 'speedux'
import { createModule } from 'speedux';

// then declare the initial state
const initialState = {
    count: 0,
    name: 'John Doe',
    data: '',
    loading: false,
};

// then export-default the module
export default createModule('demo', initialState, function({ createAction, setState, getState }) {
    // update a piece of state that relies on the previous state
    createAction('INCREASE_COUNT', function(amount) {
        setState({
            count: getState().count + amount,
        });
    });
    
    // simple state update
    createAction('CHANGE_NAME', function(name) {
        setState({
            name,
        });
    });
    
    // asyncronous state update using a generator function
    createAction('FETCH_DATA', function*() {
        setState({
            loading: true,
        });
        
        const str = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit';
        const data = yield new Promise(resolve => setTimeout(() => resolve(str), 2000));
        
        setState({
            data,
            loading: false,
        });
    });
});
```

That's it! Component state can then be accessed via `this.props[moduleName]` and component actions can be accessed via `this.props.actions[moduleName]`. The `actions` namespace is to avoid naming conflicts between different state keys, actions and component defined properties.

&nbsp;

&nbsp;

# API

### connect(component, module)

| Parameter | Type | Description |
| :----- | :----- | :----- |
| component | Class \| Function | Reference to the class/function of the component to be connected to the store. |
| module | Object | A module object that is returned from a `createModule` call. |

Connects a component to the Redux store and injects its state and actions into the component props. It takes the component to be connected and the component module object as arguments and returns the connected component.

The `connect` function will automatically map the component state and the actions defined in the module file to the component props. You will be able to access the state via `this.props[moduleName]` and component actions can be accessed via `this.props.actions[moduleName]`.

The module name is defined using the `createModule` function.

**Example:**
```javascript
import React from 'react';
import { connect } from 'speedux';

import module from './module';

const MyComponent = props => (
  <div>...</div>
);

export default connect(MyComponent, module);
```

&nbsp;

### createModule(moduleName, initialState, moduleFunction)

| Parameter | Type | Description |
| :----- | :----- | :----- |
| moduleName | String | A unique identifier for the module, this can be the component name. This identifier string is used by the `connect` method to inject the state and actions into the component props. |
| initialState | Object | The initial state object for the component. |
| moduleFunction | Function | A callback function that receives a single parameter which is an object that holds references to `setState`, `getState` and `createAction` functions. Each function will be explained in more detail later. |

Creates and returns a reference to a module object that contains the initial state, action creators object and a reducer function. This module can be used with `connect` function to connect a component to the Redux store.

**Example:**
```javascript
import { createModule } from 'speedux';

const initialState = {
    flag: false,
};

export default createModule('flagToggler', initialState, function({ createAction, setState, getState }) {
    createAction('TOGGLE_FLAG', function() {
        setState({
            flag: !getState().flag,
        });
    });
});
```

&nbsp;

### createAction(actionName, actionFunction)

| Parameter | Type | Description |
| :----- | :----- | :----- |
| actionName | String | A string that represents the action name. |
| actionFunction | Function | A callback function to execute whenever the action is dispatched. |

This function constructs the action object that will be dispatched by the store, the action creator function which will return this action object and the corresponding reducer function for a given action name.

**Type of the action object**   
The action name will be used to determine the type of the action object dispatched by the store.
The type of the action object will be in the following format: `@@{moduleName}/{actionName}`.

**Name of the action creator function**   
The action name is also used to determine the name of the action creator function that is injected into the component props. The action name is lowercased and any letter following an underscore is uppercased, resulting in a camelCase name for the function. For example, an action name `UPDATE_DATA` will generate an action creator function that has a name `updateData`. The action name can be in any format but it is recommended to use uppercase letters and an underscore to separate words.

**The actionFunction parameter**   
The action function is executed each time the action is dispatched by the store. This is where you should be using `getState` and `setState` to read and modify the component state. 

**Payload of the action object**   
The signature of the action function is used to construct the payload object that is attached to the action object. For example, `createAction('UPDATE_DATA', function(paramA, paramB){ ... })` will inject an action creator function that has a name `updateData` and accepts two parameters, `paramA` and `paramB`. This action creator function can be called inside the component life cycle methods via the props like this: `props.actions.myModule.updateData('A', 'B')`. Calling `updateData` will dispatch an action object that has the following structure:

```javascript
{
    type: '@@myModule/UPDATE_DATA',
    payload: {
        paramA: 'A',
        paramB: 'B'
    }
}
```

The `createAction` function should only be called inside the context of a module function call.

**Example:**
```javascript
/**
 * module.js
 */
import { createModule } from 'speedux';

const initialState = {
    result: 0,
};

export default createModule('myModule', initialState, function({ createAction, setState }) {
    createAction('UPDATE_DATA', function(paramA, paramB) {
        setState({
            result: paramA + paramB,
        });
    });
});

/**
 * inside render()
 */

...
render() {
    const { result } = this.props.myModule;
    const { updateData } = this.props.actions.myModule;

    return (
        <div>
            <h1>Result is: {result}</h1>
            <button onClick={() => updateData(10, 30)}>Click</button>
        </div>
    )
}
...
```

&nbsp;

### setState(stateFragmentObject)

| Parameter | Type | Description |
| :----- | :----- | :----- |
| stateFragmentObject | Object | An object that represents part of the state that needs to be updated. |

Updates the component state based on a given object. The object represents the state keys that need to be updated and their new values. For nested state keys, you can use the string dot notation.

**Example:**
```javascript
import { createModule } from 'speedux';

const initialState = {
    flag: false,
    nestedFlags: [
        {
            flagOne: {
                state: false,
            }
        },
        {
            flagTwo: {
                state: false,
            }
        }
    ]
};

export default createModule('flagToggler', initialState, function({ createAction, setState, getState }) {
    createAction('ENABLE_FLAG', function() {
        setState({
            flag: true,
        });
    });

    createAction('ENABLE_NESTED_FLAG', function() {
        setState({
            'nestedFlags[1].flagTwo.state': true,
        });
    });
});
```

&nbsp;

### getState(query)

| Parameter | Type | Description |
| :----- | :----- | :----- |
| query | String \| Object | A query string or a query object that represents part of the state object that needs to be fetched. This parameter is not required. |

Returns the component state object or part of it based on a given query. If the query parameter is a string that uses dot notation, it will return the resolved value of the given key. If the query is an object, it will return an object that has the same structure but contains the resolved values. If the query parameter is not provided, the complete state object will be returned.

**Example:**
```javascript
import { createModule } from 'speedux';

const initialState = {
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
};

export default createModule('dataLogger', initialState, function({ createAction, getState }) {
    createAction('LOG_DATA', function() {
        // a simple query string
        console.log(getState('count')); // 0

        // query string that uses dot notation
        console.log(getState('data.items[1].title')); // Item two
        console.log(getState('data.atts.tags').length); // 3
        console.log(getState('data.atts.tags[2]')); // redux

        // query object
        const state = getState({
            thirdItemTitle: 'data.items[2].title',
            secondTag: 'data.atts.tags[2]',
        });
        console.log(state.secondTag); // react

        // complete state object
        console.log(getState());
    });
});
```

&nbsp;

### addReducer(reducerKey, reducerFunction)

Allows registering a reducer function to be used when creating the root reducer of the store.

| Parameter | Type | Description |
| :----- | :----- | :----- |
| reducerKey | String | A unique identifier key for the reducer. |
| reducerFunction | Function | Reducer function to use. |

**Example:**
```javascript
import { routerReducer } from 'react-router-redux';
import { addReducer } from 'speedux';

addReducer('router', routerReducer);
```

&nbsp;

### useMiddleware(middleWare)

Allows using middleware functions such as React Router middleware and others. You don't need to use `applyMiddleware` from Redux before passing the middleware to this function.

| Parameter | Type | Description |
| :----- | :----- | :----- |
| middleWare | Function | Middleware function to use. |

**Example:**
```javascript
import { routerMiddleware } from 'react-router-redux';
import { useMiddleware } from 'speedux';

useMiddleware(routerMiddleware(history)); // assuming a defined history object
```

&nbsp;

&nbsp;

# Asyncronous Actions

To create an asyncronous action, simply pass `createAction` a generator function instead of a normal function. Whenever your generator function yields a Promise object, the function execution will pause until that promise is resolved and then it will continue. You can call `getState` and `setState` normally throughout your generator function. Here is an example:

```javascript
import { createModule } from 'speedux';

const initialState = {
    data: '',
    loading: false,
};

export default createModule('demo', initialState, function({ createAction, setState, getState }) {
    createAction('FETCH_DATA', function*() {
        // indicate that the data is being loaded
        setState({
            loading: true,
        });
        
        // go and fetch the data
        const data = yield fetch('...').then(res => res.json());
        
        // indicate that the data has been completely loaded
        // and update the state
        setState({
            data,
            loading: false,
        });
    });
});
```

&nbsp;

&nbsp;

# Middlewares

To use a middleware, import `useMiddleware` method and pass it the middleware function. You don't need to use `applyMiddleware` from Redux, this will be done automatically by Speedux. 
Here is an example using React Router (v4.2.0) and React Router Redux (v5.0.0-alpha.9):

```javascript
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { ConnectedRouter, routerReducer, routerMiddleware } from 'react-router-redux';
import createHistory from 'history/createBrowserHistory';
import { store, addReducer, useMiddleware } from 'speedux';

import Main from './Main';

const history = createHistory();

// add router reducer
addReducer('router', routerReducer);

// use the routing middleware
useMiddleware(routerMiddleware(history));

const App = (
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <Main />
    </ConnectedRouter>
  </Provider>
);

// render your app
render(App, document.getElementById('root'));
```

&nbsp;

&nbsp;

# License

MIT
