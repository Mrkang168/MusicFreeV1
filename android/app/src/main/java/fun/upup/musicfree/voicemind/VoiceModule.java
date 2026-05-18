package fun.upup.musicfree.voicemind;

import android.media.MediaRecorder;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableNativeMap;

import java.io.File;
import java.io.IOException;

public class VoiceModule extends ReactContextBaseJavaModule {
    private MediaRecorder mediaRecorder;
    private String currentFilePath;
    private boolean isRecording = false;
    private Handler handler;
    private long startTime;
    private final ReactApplicationContext reactContext;

    public VoiceModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.handler = new Handler(Looper.getMainLooper());
    }

    @Override
    public String getName() {
        return "VoiceModule";
    }

    @ReactMethod
    public void startRecording(String filePath, Promise promise) {
        try {
            if (isRecording) {
                promise.reject("Already recording", "Recording is already in progress");
                return;
            }

            currentFilePath = filePath;
            
            mediaRecorder = new MediaRecorder();
            mediaRecorder.setAudioSource(MediaRecorder.AudioSource.MIC);
            mediaRecorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
            mediaRecorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
            mediaRecorder.setAudioSamplingRate(44100);
            mediaRecorder.setAudioEncodingBitRate(128000);
            mediaRecorder.setOutputFile(filePath);
            
            mediaRecorder.prepare();
            mediaRecorder.start();
            
            isRecording = true;
            startTime = System.currentTimeMillis();

            WritableNativeMap result = new WritableNativeMap();
            result.putBoolean("success", true);
            result.putString("filePath", filePath);
            result.putDouble("duration", 0);
            
            promise.resolve(result);
        } catch (IOException e) {
            promise.reject("Recording error", e.getMessage());
        }
    }

    @ReactMethod
    public void stopRecording(Promise promise) {
        try {
            if (!isRecording || mediaRecorder == null) {
                promise.reject("Not recording", "No recording in progress");
                return;
            }

            mediaRecorder.stop();
            mediaRecorder.release();
            mediaRecorder = null;
            
            long duration = (System.currentTimeMillis() - startTime) / 1000;
            isRecording = false;

            WritableNativeMap result = new WritableNativeMap();
            result.putBoolean("success", true);
            result.putString("filePath", currentFilePath);
            result.putDouble("duration", duration);
            
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("Stop error", e.getMessage());
        }
    }

    @ReactMethod
    public void pauseRecording(Promise promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N && isRecording) {
            try {
                mediaRecorder.pause();
                promise.resolve(true);
            } catch (Exception e) {
                promise.reject("Pause error", e.getMessage());
            }
        } else {
            promise.reject("Not supported", "Pause not supported on this device");
        }
    }

    @ReactMethod
    public void resumeRecording(Promise promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N && isRecording) {
            try {
                mediaRecorder.resume();
                promise.resolve(true);
            } catch (Exception e) {
                promise.reject("Resume error", e.getMessage());
            }
        } else {
            promise.reject("Not supported", "Resume not supported on this device");
        }
    }

    @ReactMethod
    public void getRecordingStatus(Promise promise) {
        WritableNativeMap result = new WritableNativeMap();
        result.putBoolean("isRecording", isRecording);
        result.putDouble("duration", isRecording ? (System.currentTimeMillis() - startTime) / 1000.0 : 0);
        result.putString("filePath", currentFilePath);
        promise.resolve(result);
    }

    @ReactMethod
    public void deleteRecording(String filePath, Promise promise) {
        try {
            File file = new File(filePath);
            if (file.exists()) {
                boolean deleted = file.delete();
                promise.resolve(deleted);
            } else {
                promise.reject("File not found", "The recording file does not exist");
            }
        } catch (Exception e) {
            promise.reject("Delete error", e.getMessage());
        }
    }
}
