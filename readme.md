# Speedux

[![npm version](https://img.shields.io/npm/v/speedux.svg?style=flat-square)](https://www.npmjs.com/package/speedux)
[![License](https://img.shields.io/npm/l/speedux.svg)](https://www.npmjs.com/package/speedux)
[![npm downloads](https://img.shields.io/npm/dm/speedux.svg?style=flat-square)](https://www.npmjs.com/package/speedux)
[![build status](https://img.shields.io/travis/teefouad/speedux/master.svg?style=flat-square)](https://travis-ci.org/teefouad/speedux) 

An opinionated library for managing state in React apps. 

&nbsp;
&nbsp;

# Motivation
There are many things in life that are fun, working with Redux is not one of them. Redux is a great solution for state management but requires writing a lot of boilerplate code to setup and use.

Speedux reduces the amount of boilerplate code that you need to write in order to use Redux, which gives you peace of mind and more time to build the important stuff.

Speedux's API is simple and intuitive, you basically describe the state object and how it should be updated using plain JavaScript objects and functions.

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

Let's start with a simple counter app that displays three buttons. One button increases the count on click, another button decreases the count and a third button would reset the count.

### The entry file
Start with the application entry file, it's usually the _src/index.js_ file (assuming create-react-app). You would only need to import the `store` and `Provider` from Speedux and wrap your application with the `Provider` while passing it the `store` as a property. Normal Redux stuff but with less code.

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

To create a module, simply call `createModule` and pass it a name for the module (any unique identifier string) and a [configuration object](#the-configuration-object) then export the returned object.

We want our state to contain a `count` property with an initial value of zero. To update the `count` property, we need three actions: `increaseCount`, `decreaseCount` and `resetCount`.


```javascript
import { createModule } from 'speedux';

export default createModule('counter', {
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
Note that `this.state` which is used inside the module file is completely different from the local state of the component. Inside the module, `this` refers to the [module object](#the-module-object) and `this.state` refers to the component related state object which lives in the Redux store.

Now we have a module object that describes the state and how it should be updated. Next, we need to use it to connect a component to the Redux store.

### The component file

Finally, inside your stateful component file, you would need to call the [`connect`](#connectcomponent-module) function from Speedux and pass it the component and the [module object](#the-module-object) as parameters then export the returned component.

The [`connect`](#connectcomponent-module) function will inject the module state and actions into the component props, each as an object.

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

That's it! You have a fully working counter component that is connected to the Redux store. This was a very simple example to get you started. Keep reading to learn how to create asyncronous actions and listen to actions dispatched by other components.

&nbsp;
&nbsp;

# Asyncronous Actions

In a real world application, you might need to fetch data from a remote source and update the UI accordingly. For such cases, you can use an asyncronous action. To create an asyncronous action, simply use a generator function instead of a normal function.

Whenever your generator function yields an object, that object will be used to update the Redux state. If your generator function yields a Promise object, the function execution will pause until that promise is resolved and the result will be passed to the generator function on the next call. Here is an example:

```javascript
export default createModule('fetcher', {
  state: {
    loading: false,
    data: '',
  },

  actions: {
    // asyncronous action using a generator function
    *fetchData() {
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
export default createModule('faultyFetcher', {
  state: {
    loading: false,
    data: '',
    error: null,
  },

  actions: {
    *fetchData() {
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

You can use the `handlers` configuration option to listen to any action dispatched by the Redux store. Simply, use the action type as the key and the handler function as the value. For example, if a _foo_ module needs to listen to an action WOO\_HOO dispatched by another module _baz_ and also needs to listen to another action STOP_AUDIO:

```javascript
export default createModule('foo', {
    handlers: {
      '@@baz/WOO_HOO'(action) { ... },
      'STOP_AUDIO'(action) { ... },
    }
});
```

If your code contains side effects, you can use a generator function instead of a normal function:

```javascript
export default createModule('foo', {
    handlers: {
        *'@@baz/WOO_HOO'(action) { ... }
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

If the action was created by another Speedux module, you can use the action reference instead of passing the action type as a string:

```javascript
import bazModule from './components/Baz/module';

// This:
export default createModule('foo', {
  handlers: {
    [bazModule.actions.wooHoo](action) { ... }
  }
});

// is identical to this:
export default createModule('foo', {
  handlers: {
    '@@baz/WOO_HOO'(action) { ... }
  }
});
```

&nbsp;
&nbsp;

# Updating the State

Both action and handler functions define how the state should be updated by returning an object. This object specifies the state keys that need to be updated and their new values. In the following example, `changeFoo` will only update `foo` in the state with value `Bingo` while `fiz` will remain the same.

```javascript
export default createModule('foo', {
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
export default createModule('foo', {
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

```javascript
export default createModule('foo', {
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

You can pass a mapper function that returns the new value of the state key:

```javascript
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

# Dispatching Actions

Speedux provides a handy `dispatch` function that lets you dispatch any action and specify the action payload as well. Here is an example:

```javascript
import React from 'react';
import { dispatch } from 'speedux';

const MyComponent = (props) => {
    return (
        <div>
            <button
                onClick={() => {
                    dispatch('SOME_ACTION', {
                        message: 'Hello!',
                    });
                }}
            >Dispatch a custom action</button>
            
            <button
                onClick={() => {
                    dispatch('foo.doSomething', {
                        status: 'something is done',
                    });
                }}
            >Dispatch an action 'doSomething' from 'foo' module</button>
            
            <button
                onClick={() => {
                    dispatch({
                        type: '@@some/ACTION',
                        data: 'Lovely day!',
                    });
                }}
            >Dispatch a normal Redux action</button>
        </div>
    );
};
```

Local actions inside a module can be dispatched by calling `this.props.actions.actionName()`.

&nbsp;
&nbsp;

# Testing

Testing modules is easy and straight-forward, assuming that the initial counter value is `5`. You can test as follows:

```javascript
import counterModule from './Counter/module';

describe('counter tests', () => {
  it('should increase count', () => {
    expect(counterModule.actions.increaseCount()).toEqual({
      count: 6,
    });
  });

  it('should decrease count', () => {
    expect(counterModule.actions.decreaseCount()).toEqual({
      count: 4,
    });
  });

  it('should reset count', () => {
    expect(counterModule.actions.resetCount()).toEqual({
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

### createModule(name, config)

Uses a [configuration object](#the-configuration-object) to create and return a reference to a [module object](#the-module-object) that contains the initial state, action creators object and a reducer function. This module object can be used with [`connect`](#connectcomponent-module) function to connect a component to the Redux store.

| Parameter | Type | Description |
| :----- | :----- | :----- |
| name | String | Unique identifier key for the module. |
| config | Object | The [configuration object](#the-configuration-object) for the module. |

##### Example:
```javascript
import { createModule } from 'speedux';

export default createModule('foo', {
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

Connects a component to the Redux store and injects its state and actions into the component props, each as an object. It accepts two parameters, the component to be connected and the module [configuration object](#the-configuration-object) and returns the connected component.

The `connect` function will automatically map the component state and the actions defined in the module file to the component props. You will be able to access the state via `this.props.state` and component actions can be accessed via `this.props.actions`.

| Parameter | Type | Description |
| :----- | :----- | :----- |
| component | Class \| Function | Reference to the class/function of the component to be connected to the store. |
| module | Object | The [configuration object](#the-configuration-object) for the module. |

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

### getState(query)

This method returns a Promise that resolves with the state object of a module or part of it based on a given query. If the query parameter is a string that uses dot notation, it will return the resolved value of the given key. If the query is an object, it will return an object that has the same structure but contains the resolved values. If the query parameter is not provided, the complete state object will be returned.

**Note:** If you want to get the state from within the same module, use `this.getState()` instead. Only use this method if, for any reason, you would like to read the _updated_ state of another module.

| Parameter | Type | Description |
| :----- | :----- | :----- |
| query | String \| Object | A query string or a query object that represents part of the state object that needs to be fetched. This parameter is not required. |

##### Example:
```javascript
import { createModule, getState } from 'speedux';

export default createModule('foo', {
  state: {
    count: 0,
  },

  handlers: {
    *'@@baz/INCREASE_COUNT'() {
      // assuming that there are two counters, foo and baz
      // foo count should be synced with baz count, so foo
      // listens for any INCREASE_COUNT action dispatched by
      // baz and updates its count value with the current
      // count value in baz
      const bazCount = yield getState('baz.count');
      yield { count: bazCount };
    },
  },
});
```

&nbsp;

### dispatch(actionType, payload)

The `dispatch` function lets you dispatch any action and specify the action payload as well.

| Parameter | Type | Description |
| :----- | :----- | :----- |
| actionType | String | Type of the action to be dispatched. |
| payload | Object | Action payload object. |

##### Example:
```javascript
import React from 'react';
import { dispatch } from 'speedux';

const MyComponent = (props) => {
    return (
        <div>
            <button
                onClick={() => {
                    dispatch('SOME_ACTION', {
                        message: 'Hello!',
                    });
                }}
            >Dispatch a custom action</button>
        </div>
    );
};
```

You can also dispatch actions from within modules using the dot notation, simply provide the module name followed by a dot then the module action:

```javascript
import React from 'react';
import { dispatch } from 'speedux';

const MyComponent = (props) => {
    return (
        <div>
            <button
                onClick={() => {
                    dispatch('foo.logMessage', {
                        message: 'Hello!',
                    });
                }}
            >Dispatch a 'logMessage' action</button>
        </div>
    );
};
```

And `foo` module would look something like this:

```javascript
import { createModule } from 'speedux';

export default createModule('foo', {
  state: {
    logs: [],
  },
  
  actions: {
    logMessage(msg) {
      return {
        logs: [...this.state.logs, msg],
      }
    },
  },
```

You can also dispatch an action by passing an object (dot notation will not work):

```javascript
import React from 'react';
import { dispatch } from 'speedux';

const MyComponent = (props) => {
    return (
        <div>
            <button
                onClick={() => {
                    dispatch({
                        type: 'SEND_MESSAGE',
                        message: 'Hello!',
                    });
                }}
            >Say Hello</button>
        </div>
    );
};
```

&nbsp;

### addReducer(key, reducer)

Allows registering a reducer function that can listen to any action dispatched by the store.

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

The module configuration object may contain one or more of the following properties:

### actions (Object)
A hash table representing all the actions that may need to be dispatched from the component to update the state. The key or function name will be used to generate the action type. For example, a module with a name `calculator` and a defined action `addNumbers` will dispatch an action of type `@@calculator/ADD_NUMBERS` whenever `addNumbers()` is called.

```javascript
import { createModule } from 'speedux';

export default createModule('calculator', {
    state: {
        result: 0,
    },
    
    actions: {
        addNumbers(x, y) {
            return {
                result: x + y,
            };
        }
    }
});
```

The `addNumbers` action can be dispatched from the component by calling `this.props.actions.addNumbers(2,4)`.

An action function should describe how the state is updated by returning an object. Read [Updating the State](#updating-the-state) section for more information.

### handlers (Object)
The `handlers` object allows listening to any action dispatched by the store. The key represents the action type that needs to be handled and the value represents the handler function. For example, if a _foo_ module needs to listen to an action WOO_HOO dispatched by _baz_:

```javascript
import { createModule } from 'speedux';

export default createModule('foo', {
    handlers: {
        '@@baz/WOO_HOO'(action) { console.log('baz has dispatched woo_hoo!'); },
        'ANY_OTHER_ACTION'(action) { console.log('some other action was dispatched!'); },
    }
});
```

In this example, whenever the `Baz` component dispatches a `WOO_HOO` action, `Foo` will be able detect it and act accordingly. A handler function always receives the action object as a single parameter.

A handler function should describe how the state is updated by returning an object. Read [Updating the State](#updating-the-state) section for more information.

### stateKey (String)
The `stateKey` is used as a property name when the related Redux state object is injected into the component props. The default value is 'state'.

### actionsKey (String)
The `actionsKey` is used as a property name when the action creator functions object is injected into the component props. The default value is 'actions'.

### state (Object)
The initial state object for the module. This object is used to populate the Redux state object with initial values. If not provided, an empty object will be used as the initial state.

&nbsp;

# The Module Object

In most cases you will not need to work directly with the module object that is returned from a [`createModule`](#createmodulename-config) call. You do not need to use or know anything about the following methods, but keep reading if you are curious.

### config(configObject)
Updates the current configuration of the module. The `configObject` parameter represents keys that should be configured and their new values. Here is an example:

```javascript
import fooModule from './foo/module';

fooModule.config({
  stateKey: 'baz', // changes stateKey to 'baz'
});
```

### setName(name)
Accepts a name for the module as a string. This method sets the name of the module and updates the action types and reducers. Here is an example:

```javascript
import fooModule from './foo/module';

fooModule.setName('baz');
```

### createAction(name, callback)

This method builds an action creator function and a sub-reducer to handle the created action. Using this method is equivalent to defining an action in the module [configuration object](#the-configuration-object).

| Parameter | Type | Description |
| :----- | :----- | :----- |
| name | String | A string that represents the action name. |
| callback | Function | A callback function that defines how the state should be updated by returning an object. Read [Updating the State](#updating-the-state) section for more information. |

##### Example:
```javascript
import counterModule from './Counter/module';

counterModule.createAction('addNumbers', function(numA, numB) {
    return {
        result: numA + numB,
    };
});
```

If your code contains side effects, you can use a generator function instead of a normal function:

```javascript
counterModule.createAction('addNumbers', function* (numA, numB) {
    yield {
        result: numA + numB,
    };
    
    ...
});
```

### handleAction(name, callback)

Use this method to handle any action dispatched by the store and update the state accordingly. Just like [`createAction`](#createactionname-callback), it may accept a generator function as a callback to handle side effects in your code.

| Parameter | Type | Description |
| :----- | :----- | :----- |
| name | String | A string that represents the action type. |
| callback | Function | A callback function that receives the action object as a single parameter and defines how the state should be updated by returning an object. Read [Updating the State](#updating-the-state) section for more information. |

##### Example:
```javascript
import fooModule from './Foo/module';

fooModule.handleAction('@@router/CHANGE_PATH', function({ payload }) {
    console.log(payload.newPath);
    return {
        routeChanged: true,
    };
});
```

### getState(query)

This method returns the state object of the module or part of it based on a given query. If the query parameter is a string that uses dot notation, it will return the resolved value of the given key. If the query is an object, it will return an object that has the same structure but contains the resolved values. If the query parameter is not provided, the complete state object will be returned.

**Note:** If this method is used outside of an action function or a handler function, it is not guaranteed to return the updated state of the module. For such cases, use [`getState`](#getstatequery) from Speedux instead.

| Parameter | Type | Description |
| :----- | :----- | :----- |
| query | String \| Object | A query string or a query object that represents part of the state object that needs to be fetched. This parameter is not required. |

##### Example:
```javascript
import { createModule } from 'speedux';

export default createModule('foo', {
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
