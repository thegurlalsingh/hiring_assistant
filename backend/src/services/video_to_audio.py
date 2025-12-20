import sys
from moviepy.video.io.VideoFileClip import VideoFileClip

def extract_audio(video_path, audio_path):
    try:
        video = VideoFileClip(video_path)
        audio = video.audio
        audio.write_audiofile(audio_path, codec='libmp3lame')
        print(f"Audio saved to {audio_path}")
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python video_to_audio.py <video_path> <audio_path>", file=sys.stderr)
        sys.exit(1)
    
    extract_audio(sys.argv[1], sys.argv[2])