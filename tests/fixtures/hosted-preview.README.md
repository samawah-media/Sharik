# Hosted preview fixture

`hosted-preview.webm` is a generated 32 × 32 solid purple VP8 frame, used only
to verify that an authorized client can load metadata for a final delivery video.
It contains no customer content, audio, identity data or credentials.

Generated locally with Sharp (solid RGB 90/55/155 JPEG) and the official
Playwright FFmpeg runtime (`image2pipe` MJPEG input, `libvpx`, `yuv420p`, WebM).
The hosted lifecycle checks the preview dialog, video controls and metadata-reported
video width instead of treating text bytes with a video extension as media.
