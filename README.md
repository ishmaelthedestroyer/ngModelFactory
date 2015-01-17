# ngModelFactory

Angular wrapper for the Javascript implementation of the Model / Factory pattern.

<br />

## TODO

- documentation
- unit tests

## Dependencies

- EventEmitter: https://github.com/ishmaelthedestroyer/EventEmitter
- Endpoint: https://github.com/ishmaelthedestroyer/Endpoint
- Util: https://github.com/ishmaelthedestroyer/Util

## Inheritance

```
app.service('User', [
    '$log',
    'Model',
    'Util',
    function($log, Model, util) {
        var User = function(data) {
            if (!(this instanceof User)) {
                return new User(User, config);
            }

            Model.call(this, data);

            this.followers = [];

            return this;
        };

        util.inherits(User, Model);

        User.prototype.follow = function(user) {
            user.followers.push(this);
        };

        /*
         * `User` model has all of `Model` methods, i.e:
         * `User::$save()`
         * `User::$update()`
         * `User::$delete()`
         */

        // expose class so Factory can instantiate instances
        return User;
    }
]);

app.service('UserFactory', [
    'Factory',
    'User',
    'Util',
    function(Factory, User, util) {
        var UserFactory = function(User, config) {
            if (!(this instanceof UserFactory)) {
                return new UserFactory(User, config);
            }

            Factory.call(this, User, config);
            return this;
        };

        util.inherits(UserFactory, Factory);

        /*
         * `UserFactory` has all of `Factory` methods, i.e:
         * `UserFactory::$list()`
         * `UserFactory::$find()`
         * `UserFactory::$map()`
         * etc
         */

        // expose singleton
        return new UserFactory(User, {
            endpoints: {
                list: { method: 'GET', path: '/users' },
                find: { method: 'GET', path: '/users/:id' },
                create: { method: 'POST', path: '/users' },
                update: { method: 'PUT', path: '/users/:id' },
                del: { method: 'DELETE', path: '/users/:id' }
            }
        });
    }
]);

app.controller('AppCtrl', [
    'UserFactory',
    function(UserFactory) {

    }
]);
```

## Notes
Developed by <a href='http://twitter.com/ishmaelsalive'>ishmaelthedestroyer</a>. <br />

Feedback, suggestions? Tweet me <a href='http://twitter.com/ishmaelsalive'>@IshmaelsAlive</a>. <br />

<br />

## License
Licensed under the MIT license. tl;dr You can do whatever you want with it.