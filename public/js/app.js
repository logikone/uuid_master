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
    host: 'http://localhost:3000'
});

App.ApplicationRoute = Ember.Route.extend({
    model: function() {
        return this.store.find('uuid');
    },
    actions: {
        delete: function(id) {
            var uuid = this.store.getById('uuid', id);
			uuid.destroyRecord();
        },
		updateUuids: function(content) {
			console.log(this);
			console.log(content);
		}
    }
});
