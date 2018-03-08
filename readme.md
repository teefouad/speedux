# Speedux for Redux

Speedux is an opinionated library that allows you to create actions and reducers for Redux, automatically. Speedux reduces the amount of code that needs to be written in a Redux application giving you peace of mind and more time to code the important stuff.

[![build status](https://img.shields.io/travis/teefouad/speedux/master.svg?style=flat-square)](https://travis-ci.org/teefouad/speedux) 
[![npm version](https://img.shields.io/npm/v/speedux.svg?style=flat-square)](https://www.npmjs.com/package/speedux)
[![npm downloads](https://img.shields.io/npm/dm/speedux.svg?style=flat-square)](https://www.npmjs.com/package/speedux)

&nbsp;

**Try it on CodeSandbox**

[![Edit rrjqo6lz64](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/rrjqo6lz64)

&nbsp;
&nbsp;

# Motivation
When you create a React application that uses Redux for state management, you would create a store by combining all reducers in your app to create one big single root reducer. You would also be creating so many files for each stateful component to connect it to the store, one file for the action types, another for the action creators and another for the reducer and so on. Not to mention that you'd need to map the related state and the action creators to the props of each one of those components.

This is tedious and repetitive work and that is never a good thing because it increases your chances of making mistakes and creating bugs.

Speedux got you covered! Behind the scenes, it will take care of all of this so you can relax and focus on writing the bytes that Make the World a Better Place ™. 

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

# Getting Started

Let's say that you want to build a very simple counter component that displays three buttons. One increases the count on click, another that decreases the count and a third button that resets the count.

### The entry file
Start with the application entry file, it's usually the _src/index.js_ file (assuming create-react-app). You would only need to import the `store` from Speedux and pass it to the `Provider`.

```javascript
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { store } from 'speedux';

import Counter from './Counter';

const App = (
  <Provider store={store}>
    <Counter />
  </Provider>
);

// render your app
render(App, document.getElementById('root'));
```

### The module file

Next, create a module file that will contain the initial state for your stateful counter component and all the logic required to update it.


```javascript
/* counter-module.js */
import { createModule } from 'speedux';

const initialState = { count: 0 };

export default createModule('counter', initialState, ({ createAction, getState }) => {
  createAction('increaseCount', () => ({ count: getState().count + 1 }));
  createAction('decreaseCount', () => ({ count: getState().count - 1 }));
  createAction('resetCount', () => ({ count: 0 }));
});
```

### The component file

Finally, inside your stateful component file, you would need to import the `connect` function from Speedux and pass it the component and the module object as parameters then export the returned component.

```javascript
/* File: Counter.js */

import React from 'react';
import { connect } from 'speedux';

import module from './counter-module';

const Counter = function(props) {
  const { count } = props.counter;
  const { increaseCount, decreaseCount, resetCount } = props.actions.counter;

  return (
      <div>
        <h1>Count: {count}</h1>
        <button onClick={increaseCount}>Increase Count</button>
        <button onClick={decreaseCount}>Decrease Count</button>
        <button onClick={resetCount}>Reset Count</button>
      </div>
    );
};

export default connect(Counter, module);
```

That's it! You have a fully working counter component.

&nbsp;
&nbsp;

# API

### createModule(name, initialState, callback)

Creates and returns a reference to a module object that contains the initial state, action creators object and a reducer function. This module object can be used with [`connect`](#connectcomponent-module) function to connect a component to the Redux store.

| Parameter | Type | Description |
| :----- | :----- | :----- |
| name | String | A unique identifier for the module. This identifier string is used by the [`connect`](#connectcomponent-module) method to inject the state and actions into the component props. |
| initialState | Object | The initial state object for the component. |
| callback | Function | A callback function that receives a single parameter, this parameter is an object that holds references to [`createAction`](#createactionname-callback), [`handleAction`](#handleactionname-callback) and [`getState`](#getstatequery) functions. Each function will be explained in more detail later. |

##### Example:
```javascript
import { createModule } from 'speedux';

const initialState = {
    flag: false,
};

export default createModule('dashboard', initialState, function({ createAction, getState }) {
    createAction('toggleFlag', function() {
        return {
            flag: !getState().flag,
        };
    });
});
```

&nbsp;

### createAction(name, callback)

| Parameter | Type | Description |
| :----- | :----- | :----- |
| name | String | A string that represents the action name. |
| callback | Function | A callback function that defines how the state should be updated by returning an object which specifies the state keys that need to be updated and their new values. |

This method will create an action dispatcher in the component props that has the same name. For example, `createAction('addUser', function(name) { ... })` will create `props.actions.moduleName.addUser(name)`.

##### Example:
```javascript
/* module.js */
import { createModule } from 'speedux';

const initialState = { result: 0 };

export default createModule('calculator', initialState, function({ createAction }) {
    createAction('addNumbers', function(numA, numB) {
        return {
            result: numA + numB,
        };
    });
});

/* inside render() */
...
render() {
    const { result } = this.props.calculator;
    const { addNumbers } = this.props.actions.calculator;

    return (
        <div>
            <h1>Result is: {result}</h1>
            <button onClick={() => addNumbers(10, 30)}>Click for the result</button>
        </div>
    )
}
...
```

#### Side Effects
If your code contains side effects, use a generator function instead of a normal function. Whenever your generator function yields an object, the object will be used to update the state. If the generator function yields a Promise object, the promise will be resolved first and its result will be returned to the generator function in the next call.

##### Example:
```javascript
/* module.js */
import { createModule } from 'speedux';

const initialState = {
    loading: false,
    posts: [],
};

export default createModule('blog', initialState, function({ createAction }) {
    createAction('fetchPosts', function*() {
        // an object is yielded, so update state key `loading` to be true
        yield { loading: true };
        // a promise object is yielded, the function will pause and once that promise is resolved, the result will be assigned to `data`
        const data = yield fetch('...').then(response => response.json());
        // an object is yielded again, so the state will be updated again
        yield { loading: false, posts: data.posts };
    });
});

/* inside render() */
...
render() {
    const { loading, posts } = this.props.blog;
    const { fetchPosts } = this.props.actions.blog;

    return (
        <div>
            <div>{ loading ? 'Loading...' : this.displayPosts(posts) }</div>
            <button onClick={fetchPosts}>Load posts</button>
        </div>
    )
}
...
```

#### Nested State Keys
For nested state keys, you can provide a string that uses dot notation:

```javascript
const initialState = {
    result: 0,
    data: {
        list: [
            { props: { name: 'feeb' } },
            { props: { name: 'foo' } },
            { props: { name: 'fiz' } },
        ],
    },
};

export default createModule('people', initialState, function({ createAction }) {
    createAction('changeFooName', function(newName) {
        return {
            'data.list[1].props.name': newName,
        };
    });
});
```

#### Wildcard Character: *
If you would like to modify all items of an array or an object in the state, use a wildcard character:

```javascript
const initialState = {
    list: [
        { name: 'feeb' },
        { name: 'foo' },
        { name: 'fiz' },
    ],
};

export default createModule('people', initialState, function({ createAction }) {
    createAction('changeAllNames', function(newName) {
        return {
            'list.*.name': newName,
        };
    });
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

```javascript
const initialState = {
    list: [
        { name: 'feeb' },
        { name: 'foo' },
        { name: 'fiz' },
    ],
};

export default createModule('people', initialState, function({ createAction, getState }) {
    createAction('logAllNames', function() {
        const names = getState('list.*.name');
        console.log(names); // ['feeb', 'foo', 'fiz']
    });
});
```

#### Resolver Function

You can pass a function that returns the new value of the state key:

```javascript
const initialState = {
    list: [
        { count: 151 },
        { count: 120 },
        { count: 2 },
    ],
};

export default createModule('people', initialState, function({ createAction }) {
    createAction('setMinimum', function() {
        return {
            'list.*.count': (oldValue) => {
                if (oldValue < 50) return 50;
                return oldValue;
            },
        };
    });
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

### handleAction(name, callback)

| Parameter | Type | Description |
| :----- | :----- | :----- |
| name | String | A string that represents the action type that needs to be handled. |
| callback | Function | A callback function that defines how the state should be updated by returning an object which specifies the state keys that need to be updated and their new values. This callback function receives the action object as a single parameter. |

This method allows you to handle any action dispatched by the store and update the state accordingly. Just like [`createAction`](#createactionname-callback), it may accept a generator function as a callback to handle side effects in your code.

##### Example:
```javascript
/* module.js */
import { createModule } from 'speedux';

const initialState = { routeChanged: false };

export default createModule('myModule', initialState, function({ handleAction }) {
    handleAction('@@router/CHANGE_PATH', function({ payload }) {
        console.log(payload.newPath);
        return {
            routeChanged: true,
        };
    });
});
```

&nbsp;

### getState(query)

| Parameter | Type | Description |
| :----- | :----- | :----- |
| query | String \| Object | A query string or a query object that represents part of the state object that needs to be fetched. This parameter is not required. |

Returns the component state object or part of it based on a given query. If the query parameter is a string that uses dot notation, it will return the resolved value of the given key. If the query is an object, it will return an object that has the same structure but contains the resolved values. If the query parameter is not provided, the complete state object will be returned.

##### Example:
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
    createAction('logData', function() {
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

### connect(component, module)

| Parameter | Type | Description |
| :----- | :----- | :----- |
| component | Class \| Function | Reference to the class/function of the component to be connected to the store. |
| module | Object | A module object that is returned from a [`createModule`](#createmodulename-initialstate-callback) call. |

Connects a component to the Redux store and injects its state and actions into the component props. It takes the component to be connected and the module object as arguments and returns the connected component.

The [`connect`](#connectcomponent-module) function will automatically map the component state and the actions defined in the module file to the component props. You will be able to access the state via `this.props[moduleName]` and component actions can be accessed via `this.props.actions[moduleName]`.

The module name is defined using the [`createModule`](#createmodulename-initialstate-callback) function.

##### Example:
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

### addReducer(key, reducer)

Allows registering a reducer function to be used when creating the root reducer of the store.

| Parameter | Type | Description |
| :----- | :----- | :----- |
| key | String | A unique identifier key for the reducer. |
| reducer | Function | Reducer function to use. |

##### Example:
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

##### Example:
```javascript
import { routerMiddleware } from 'react-router-redux';
import { useMiddleware } from 'speedux';

useMiddleware(routerMiddleware(history)); // assuming a defined history object
```

&nbsp;
&nbsp;

# Asyncronous Actions

To create an asyncronous action, simply pass [`createAction`](#createactionname-callback) or [`handleAction`](#handleactionname-callback) a generator function instead of a normal function. Whenever your generator function yields an object, that object will be used to update the state. If your generator function yields a Promise object, the function execution will pause until that promise is resolved and the result will be passed to the generator function on the next call. Here is an example:

```javascript
import { createModule } from 'speedux';

const initialState = {
    data: '',
    loading: false,
};

export default createModule('demo', initialState, function({ createAction, getState }) {
    createAction('fetchData', function*() {
        // indicate that the data is being loaded
        yield { loading: true };
        
        // go and fetch the data
        const data = yield fetch('...').then(response => response.json());
        
        // indicate that the data has been completely loaded and update the state
        yield {
            loading: false,
            data,
        };
    });
});
```

&nbsp;
&nbsp;

# Middlewares

To use a middleware, import [`useMiddleware`](#usemiddlewaremiddleware) method and pass it the middleware function. You don't need to use `applyMiddleware` from Redux, this will be done automatically by Speedux. 
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