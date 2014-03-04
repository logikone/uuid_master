App = Ember.Application.create();

App.Router.map( function() {
    this.resource('uuids', { path: '/' });
});

App.Uuid = DS.Model.extend({
    host_name: DS.attr(),
    host_uuid: DS.attr(),
    state: DS.attr()
});

App.Uuid.reopenClass({
    confirmdeny: function(id, state) {
        var uuid = this.store.getById('uuid', id );

        $.getJSON('/api/uuids/' + id + '/edit?state=' + state, function(data) {
            uuid.set('state', state);
        })
    },
    deleteuuid: function(id) {
        var uuid = this.store.getById('uuid', id );

        $.ajax({
            url: '/api/uuids/' + id,
            type: 'DELETE',
            success: function(data) {
                uuid.deleteRecord()
            }
        });
    }
});

App.UuidAdapter = DS.RESTAdapter.extend({
    namespace: 'api',
    host: 'http://appdb01.qa0.mozyops.com:3000'
});

App.ApplicationController = Ember.Controller.extend({
    formoptions: [
        { action: "Confirm", id: 1 },
        { action: "Deny", id: 2 },
        { action: "Delete", id: 3 }
    ]
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
		updateUuids: function() {
            var uuids  = new Array();
            var action = $('select[name=option]').val();

            $('input:checked[type=checkbox]').each( function(index) {
                uuids.push(this.value);
            });

            for ( var x = 0; x < uuids.length; x++ ) {
                if (action == 1 ) {
                    App.Uuid.confirmdeny(uuids[x], 'CONFIRMED');
                }
                if (action == 2 ) {
                    App.Uuid.confirmdeny(uuids[x], 'DENIED');
                }
                if (action == 3 ) {
                    App.Uuid.deleteuuid(uuids[x]);
                }
            }
		},
        checked: function(row) {
            console.log(row);
            console.log(row.store);
            console.log(Object.keys(row));
        }
    }
});
