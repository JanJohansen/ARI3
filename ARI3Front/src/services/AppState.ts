import Vue from 'vue'

class AppState {
    [name: string]: any     // TS lingo for Allow everything - dynamically!
    constructor(){
    }
}

var glob: {[name: string]: any} = {}
Vue.set(glob, "appState", new AppState())

export var appState = glob