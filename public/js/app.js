App = Ember.Application.create();

App.Router.map( function() {
    this.resource('uuids', { path: '/' }, function() {
        this.resource('uuid', { path: '/:uuid' } );
    });
});

App.Uuid = DS.Model.extend({
    host_name: DS.attr(),
    host_uuid: DS.attr(),
    uuid: DS.attr(),
    state: DS.attr()
});

App.UuidAdapter = DS.RESTAdapter.extend({
    namespace: 'api',
    host: 'http://appdb01.qa0.mozyops.com:3000'
});

App.UuidsRoute = Ember.Route.extend({
    model: function() {
        return this.store.find('uuid');
    }
});

App.UuidRoute = Ember.Route.extend({
    model: function(params) {
        return this.store.find('uuid', params.uuid);
    }
});
