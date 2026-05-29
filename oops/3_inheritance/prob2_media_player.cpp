/*
 * PROBLEM 2: Media Player — Media → AudioFile, VideoFile
 *
 * PROBLEM STATEMENT:
 * Create a base class 'Media' representing generic media file properties:
 * - Title, size in MB, format/extension (e.g. mp3, mp4)
 * - Virtual play() method.
 * Implement 'AudioFile' class:
 * - Additional properties: artist, duration in seconds.
 * - Override play() to output audio playing details.
 * Implement 'VideoFile' class:
 * - Additional properties: resolution (e.g. 1080p), frameRate.
 * - Override play() to output video playing details.
 *
 * Compile: g++ prob2_media_player.cpp -o prob2 && ./prob2
 */

#include <iostream>
#include <string>
using namespace std;

class Media {
protected:
    string title;
    double sizeMB;
    string format;

public:
    Media(string t, double s, string f) : title(t), sizeMB(s), format(f) {}

    virtual void play() {
        cout << "Playing generic media: " << title << " (" << sizeMB << " MB, format: " << format << ")" << endl;
    }

    virtual ~Media() {}
};

class AudioFile : public Media {
private:
    string artist;
    int durationSec;

public:
    AudioFile(string t, double s, string f, string a, int d)
        : Media(t, s, f), artist(a), durationSec(d) {}

    void play() override {
        cout << "[Audio Player] Playing \"" << title << "\" by " << artist 
             << " | Format: " << format << " | Size: " << sizeMB << " MB | Duration: " 
             << (durationSec / 60) << ":" << (durationSec % 60) << endl;
    }
};

class VideoFile : public Media {
private:
    string resolution;
    int frameRate;

public:
    VideoFile(string t, double s, string f, string r, int fps)
        : Media(t, s, f), resolution(r), frameRate(fps) {}

    void play() override {
        cout << "[Video Player] Rendering video \"" << title << "\" | Resolution: " << resolution 
             << " | FPS: " << frameRate << " | Format: " << format << " | Size: " << sizeMB << " MB" << endl;
    }
};

int main() {
    AudioFile song("Perfect", 4.2, "mp3", "Ed Sheeran", 263);
    VideoFile movie("Interstellar", 2400.0, "mkv", "4K Ultra HD", 60);

    Media* playlist[] = {&song, &movie};

    cout << "=== Starting Media Playlist ===" << endl;
    for (auto* m : playlist) {
        m->play();
        cout << "------------------------------------" << endl;
    }

    return 0;
}
