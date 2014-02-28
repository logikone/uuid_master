App = Ember.Application.create();

App.Router.map( function() {
    this.resource('uuids', { path: '/' });
});

App.Uuid = DS.Model.extend({
    host_name: DS.attr(),
    host_uuid: DS.attr(),
    state: DS.attr()
});

App.UuidAdapter = DS.RESTAdapter.extend({
    namespace: 'api',
    host: 'http://appdb01.qa0.mozyops.com:3000'
});

App.ApplicationRoute = Ember.Route.extend({
    model: function() {
        return this.store.find('uuid');
    },
    actions: {
        delete: function(id) {
            var uuid = this.store.find('uuid', id);
            uuid.destroyRecord();
        }
    }
});
