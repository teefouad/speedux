# Speedux for Redux

Speedux is an opinionated library that allows you to create actions and reducers for Redux, automatically. Speedux reduces the amount of code that needs to be written in a Redux application, giving you peace of mind and more time to code the important stuff.

[![build status](https://img.shields.io/travis/teefouad/speedux/master.svg?style=flat-square)](https://travis-ci.org/teefouad/speedux) 
[![npm version](https://img.shields.io/npm/v/speedux.svg?style=flat-square)](https://www.npmjs.com/package/speedux)
[![npm downloads](https://img.shields.io/npm/dm/speedux.svg?style=flat-square)](https://www.npmjs.com/package/speedux)

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

Let's say that you want to build a simple counter app that displays three buttons. One button increases the count on click, another button decreases the count and a third button would reset the count.

### The entry file
Start with the application entry file, it's usually the _src/index.js_ file (assuming create-react-app). You would only need to import the `store` and `Provider` from Speedux and wrap your application with the `Provider` while passing it the `store`.

```javascript
import React from 'react';
import ReactDOM from 'react-dom';
import { store, Provider } from 'speedux';

import Counter from './Counter';

const App = (
  <Provider store={store}>
    <Counter />
  </Provider>
);

ReactDOM.render(App, document.getElementById('root'));
```

That's pretty much all you need to do here.

### The module file

Next, create a _module.js_ file that will contain the initial state for your stateful counter component and all the logic required to update it.

To create a module, import [`createModule`](#createmoduleconfig) and pass it a [configuration object](#the-configuration-object). Initially, we want our state to contain a `count` property with an initial value of zero.

To update this `count` property, we need three actions: `increaseCount`, `decreaseCount` and `resetCount`.


```javascript
import { createModule } from 'speedux';

export default createModule({
  state: { count: 0 },

  actions: {
    increaseCount() {
      return {
        count: this.state.count + 1,
      };
    },

    decreaseCount() {
      return {
        count: this.state.count - 1,
      };
    },

    resetCount: () => ({
      count: 0,
    }),
  },
});
```
Note that `this.state` which is used inside the module file is completely different from the local state of the component. Inside the module file, `this` refers to the [module object](#the-module-object) and `this.state` refers to the related state that lives in the Redux store.

### The component file

Finally, inside your stateful component file, you would need to import the [`connect`](#connectcomponent-module) function from Speedux and pass it the component and the [module object](#the-module-object) as parameters then export the returned component.

The [`connect`](#connectcomponent-module) function will inject the module state and actions into the component props. You can then use object destructuring to access each one.

```javascript
import React, { Component } from 'react';
import { connect } from 'speedux';

import module from './module';

class Counter extends Component {
  render() {
    // use object destructuring to access module state and actions
    const { state, actions } = this.props;

    return (
      <div>
        <h1>Count is: {state.count}</h1>
        <button onClick={actions.increaseCount}>Increase count</button>
        <button onClick={actions.decreaseCount}>Decrease count</button>
        <button onClick={actions.resetCount}>Reset count</button>
      </div>
    );
  }
}

export default connect(Counter, module);
```

That's it! You have a fully working counter component that is connected to the Redux store. This was a very simple example to get you started. Keep reading to learn how to dispatch asyncronous actions and listen to actions dispatched by other components.

# Asyncronous Actions

In a real world application, you might need to fetch data from a remote source and update the UI accordingly. For such cases, you can use an asyncronous action. To create an asyncronous action, simply use a generator function instead of a normal function.

Whenever your generator function yields an object, that object will be used to update the Redux state. If your generator function yields a Promise object, the function execution will pause until that promise is resolved and the result will be passed to the generator function on the next call. Here is an example:

```javascript
createModule({
  state: {
    loading: false,
    data: '',
  },

  actions: {
    // asyncronous action using a generator function
    * fetchData() {
      // yield an object to update the state and indicate that the data is being loaded
      yield { loading: true };

      // yield a promise to fetch the data
      const data = yield fetch('/api/posts').then(response => response.json());

      // yield an object to update the state and indicate that the data has been completely loaded
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

To handle errors in an asyncronous action, you can catch a rejected promise then check if the response is an instance of `Error`:

```javascript
createModule({
  state: {
    loading: false,
    data: '',
    error: null,
  },

  actions: {
    * fetchData() {
      // yield an object to update the state and indicate that the data is being loaded
      yield { loading: true };

      // yield a promise to fetch the data
      const result = yield fetch('/api/posts').then(response => response.json()).catch(err => err);

      if (result instanceof Error) {
        yield {
          error: result.message,
        };
      } else {
        // yield an object to update the state and indicate that the data has been completely loaded
        yield {
          loading: false,
          data: result.posts,
        };
      }
    },
  },
});
```

&nbsp;
&nbsp;

# Listening to Actions

A module can also listen to actions dispatched by other modules. Simply, use the action type as the key and the handler function as the value. For example, if a _foo_ module needs to listen to an action WOO\_HOO dispatched by another module _baz_:

```javascript
createModule({
    name: 'foo',
    handlers: {
        '@@baz/WOO_HOO'(action) { ... }
    }
});
```

If your code contains side effects, you can use a generator function instead of a normal function:

```javascript
createModule({
    name: 'foo',
    handlers: {
        * '@@baz/WOO_HOO'(action) { ... }
    }
});
```

**Note:**
```javascript
// This syntax:
{ '@@baz/WOO_HOO'(action) { ... } }

// is identical to this:
{ '@@baz/WOO_HOO': function(action) { ... } }
```

&nbsp;
&nbsp;

# Updating the State

Both action and handler functions define how the state should be updated by returning an object. This object specifies the state keys that need to be updated and their new values. In the following example, `changeFoo` will only update `foo` in the state with value `Bingo` while `fiz` will remain the same.

```javascript
createModule({
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
To update deeply nested state keys, you can provide a string that uses dot notation:

```javascript
export default createModule({
    state: {
        result: 0,
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

```javascript
export default createModule({
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

```javascript
export default createModule({
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

### Resolver Function

You can pass a resolver function that returns the new value of the state key:

```javascript
export default createModule({
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

# Testing

Testing modules is easy and straight-forward. First, you need to create a mock Redux store:

```javascript
const mockStore = {
  getState: () => ({
    counter: {
      count: 5,
    },
  }),
};
```

Next, you need to configure the module to use the mock store. Note that the module name is used to extract the module state from the store state object.

```javascript
module.config({
  name: 'counter',
  store: mockStore,
});
```

Now you can test your module easily:

```javascript
it('should increase count', () => {
  expect(module.actions.increase()).toEqual({
    count: 6,
  });
});
```

Here is the complete test suite for the counter example:

```javascript
import module from './module';

const mockStore = {
  getState: () => ({
    counter: {
      count: 5,
    },
  }),
};

module.config({
  name: 'counter',
  store: mockStore,
});

describe('counter tests', () => {
  it('should increase count', () => {
    expect(module.actions.increaseCount()).toEqual({
      count: 6,
    });
  });

  it('should decrease count', () => {
    expect(module.actions.decreaseCount()).toEqual({
      count: 4,
    });
  });

  it('should reset count', () => {
    expect(module.actions.resetCount()).toEqual({
      count: 0,
    });
  });
});
```
&nbsp;
&nbsp;

# Middlewares

To use a middleware, import [`useMiddleware`](#usemiddlewaremiddleware) method and pass it the middleware function. You don't need to use `applyMiddleware` from Redux, this method will be called internally by Speedux. 
Here is an example using React Router (v4.2.0) and React Router Redux (v5.0.0-alpha.9):

```javascript
import React from 'react';
import { render } from 'react-dom';
import { ConnectedRouter, routerReducer, routerMiddleware } from 'react-router-redux';
import createHistory from 'history/createBrowserHistory';
import { Provider, store, addReducer, useMiddleware } from 'speedux';

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

# API

### createModule(config)

Uses a [configuration object](#the-configuration-object) to create and return a reference to a [module object](#the-module-object) that contains the initial state, action creators object and a reducer function. This module object can be used with [`connect`](#connectcomponent-module) function to connect a component to the Redux store.

| Parameter | Type | Description |
| :----- | :----- | :----- |
| config | Object | The [configuration object](#the-configuration-object) for the module. |

##### Example:
```javascript
import { createModule } from 'speedux';

export default createModule({
  state: {
    flag: false,
  },

  actions: {
    toggleFlag() {
      return {
        flag: !this.state.flag,
      };
    }
  }
});
```

&nbsp;

### connect(component, module)

Connects a component to the Redux store and injects its state and actions into the component props. It takes the component to be connected and the module object as arguments and returns the connected component.

The `connect` function will automatically map the component state and the actions defined in the module file to the component props. You will be able to access the state via `this.props.state` and component actions can be accessed via `this.props.actions`.

| Parameter | Type | Description |
| :----- | :----- | :----- |
| component | Class \| Function | Reference to the class/function of the component to be connected to the store. |
| module | Object | A [module object](#the-module-object) that is returned from a [`createModule`](#createmoduleconfig) call. |

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

# The Configuration Object

The module configuration object may contain any of the following properties:

### name (String)
Name of the module. The module name should be a unique string and will be used as a prefix for all actions dispatched by the related component. The module name will also be used as a key in the global Redux state. If the module name is not provided, it will be inferred from the component name.

### actions (Object)
A hash table representing all the actions that need to be dispatched from the component. The key or function name will be used to generate the action type. For example, a module with a name `calculator` and a defined action `addNumbers` will dispatch an action of type `@@calculator/ADD_NUMBERS` whenever `addNumbers()` is called.

```javascript
createModule({
    name: 'calculator',
    actions: {
        addNumbers(x, y) { ... }
    }
});
```

The `addNumbers` action can be dispatched from the component by calling `this.props.actions.addNumbers(2,4)`.

An action function defines how the state should be updated by returning an object. This object specifies the state keys that need to be updated and their new values.

If your code contains side effects, you can create an asyncronous action by using a generator function instead of a normal function:

```javascript
createModule({
    name: 'calculator',
    actions: {
        * addNumbersAsync(x, y) { ... }
    }
});
```

Whenever the generator function yields an object, that object will be used to update the Redux state. If your generator function yields a Promise object, the function execution will pause until that promise is resolved and the result will be passed to the generator function on the next call.

### handlers (Object)
A hash table representing all the foreign actions that the module is listening to. A foreign action is an action dispatched by another module. The key represents the action type that the module needs to handle. For example, if a _foo_ module needs to listen to an action WOO_HOO dispatched by another module _baz_:

```javascript
createModule({
    name: 'foo',
    handlers: {
        '@@baz/WOO_HOO'(action) { ... }
    }
});
```

Whenever the `baz` component dispatches a `WOO_HOO` action, `foo` will be able detect it and act accordingly. A handler function always receives the action object as a single parameter.

A handler function defines how the state should be updated by returning an object. This object specifies the state keys that need to be updated and their new values.

If your code contains side effects, you can use a generator function instead of a normal function:

```javascript
createModule({
    name: 'foo',
    handlers: {
        * '@@baz/WOO_HOO'(action) { ... }
    }
});
```

Whenever the generator function yields an object, that object will be used to update the Redux state. If your generator function yields a Promise object, the function execution will pause until that promise is resolved and the result will be passed to the generator function on the next call.

### stateKey (String)
The `stateKey` is used as a property name when the related Redux state  is injected into the component props. The default value is 'state'.

### actionsKey (String)
The `actionsKey` is used as a property name when the action creator functions are injected into the component props. The default value is 'actions'.

### state (Object)
The initial state object for the module. This object is used to populate the Redux state object with initial values. If not provided, an empty object will be used as the initial state.

### store (Object)
Reference to the Redux store. You don't have to provide the reference yourself. This is done automatically when you create a new module, however, it's useful to be able to set a reference to a Redux store while testing the module.

&nbsp;

# The Module Object

The module object returned from a [`createModule`](#createmoduleconfig) call has the following methods:

### config(configObject)
Updates the current configuration of the module. The `configObject` represents keys that should be configured and their new values. Here is an example:

```javascript
module.config({
  stateKey: 'foo',
});
```

### setName(name)
Accepts the name of the module as a string. This method sets the name of the module and updates the action types and reducers.

### createAction(name, callback)

This method builds an action creator function and a sub-reducer to handle the created action. Using this method is equivalent to defining an action in the module [configuration object](#the-configuration-object).

| Parameter | Type | Description |
| :----- | :----- | :----- |
| name | String | A string that represents the action name. |
| callback | Function | A callback function that defines how the state should be updated by returning an object. This object specifies the state keys that need to be updated and their new values. |

##### Example:
```javascript
import { createModule } from 'speedux';

const module = createModule({
    state: { result: 0 },
});

module.createAction('addNumbers', function(numA, numB) {
    return {
        result: numA + numB,
    };
});
```

If your code contains side effects, you can use a generator function instead of a normal function:

```javascript
module.createAction('addNumbers', function* (numA, numB) {
    yield {
        result: numA + numB,
    };
    
    ...
});
```

### handleAction(name, callback)

This method allows you to handle any action dispatched by the store and update the state accordingly. Just like [`createAction`](#createactionname-callback), it may accept a generator function as a callback to handle side effects in your code.

| Parameter | Type | Description |
| :----- | :----- | :----- |
| name | String | A string that represents the action type that needs to be handled. |
| callback | Function | A callback function that defines how the state should be updated by returning an object. This object specifies the state keys that need to be updated and their new values. This callback function receives the action object as a single parameter. |

##### Example:
```javascript
import { createModule } from 'speedux';

const module = createModule({
    state: { routeChanged: false },
});

module.handleAction('@@router/CHANGE_PATH', function({ payload }) {
    console.log(payload.newPath);
    return {
        routeChanged: true,
    };
});
```

### getState(query)

This method returns the Redux state object of the module or part of it based on a given query. If the query parameter is a string that uses dot notation, it will return the resolved value of the given key. If the query is an object, it will return an object that has the same structure but contains the resolved values. If the query parameter is not provided, the complete state object will be returned.

| Parameter | Type | Description |
| :----- | :----- | :----- |
| query | String \| Object | A query string or a query object that represents part of the state object that needs to be fetched. This parameter is not required. |

##### Example:
```javascript
import { createModule } from 'speedux';

export default createModule({
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

# License

MIT
