package com.habeshastreams.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ScreenProtectionPlugin.class);
        registerPlugin(LiveStreamPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
