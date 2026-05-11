// Capacitor needs an Objective-C bridge file to register Swift plugins.
// This exposes the Swift class methods to the Capacitor runtime so the JS
// side can call them via `LiveStream.startPreview()` etc.
//
// Drop this file alongside LiveStreamPlugin.swift inside ios/App/App/.

#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(LiveStreamPlugin, "LiveStream",
    CAP_PLUGIN_METHOD(requestPermissions, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(startPreview, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(startStreaming, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(stopStreaming, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(switchCamera, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(toggleMute, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(getStatus, CAPPluginReturnPromise);
)
