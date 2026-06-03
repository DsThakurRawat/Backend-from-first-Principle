// workflows/video_processing.go
package workflows

import (
    "time"
    "go.temporal.io/sdk/workflow"
    "go.temporal.io/sdk/activity"
    "myapp/activities"
)

// VideoProcessingWorkflow — orchestrates the entire pipeline
// Temporal persists every step — crash at any point = resume here
func VideoProcessingWorkflow(ctx workflow.Context, videoID string) error {
    // Activity options — each step has its own retry policy
    actOpts := workflow.ActivityOptions{
        StartToCloseTimeout: 10 * time.Minute,
        RetryPolicy: &temporal.RetryPolicy{
            MaxAttempts:        3,
            InitialInterval:    time.Minute,
            BackoffCoefficient: 2.0,
        },
    }
    ctx = workflow.WithActivityOptions(ctx, actOpts)

    // Step 1: Encode video to multiple resolutions
    // If server crashes here, workflow resumes from step 1 on restart
    var encodedPath string
    if err := workflow.ExecuteActivity(ctx, activities.EncodeVideo, videoID).Get(ctx, &encodedPath); err != nil {
        return err // step 1 failed all retries — workflow fails
    }

    // Step 2 + 3: Thumbnail generation AND transcription in parallel
    thumbFuture := workflow.ExecuteActivity(ctx, activities.GenerateThumbnails, encodedPath)
    transcriptFuture := workflow.ExecuteActivity(ctx, activities.GenerateTranscription, encodedPath)

    // Wait for both — if either fails, the workflow fails (with its own retries first)
    if err := thumbFuture.Get(ctx, nil); err != nil { return err }
    if err := transcriptFuture.Get(ctx, nil); err != nil { return err }

    // Step 4: Process thumbnails (depends on step 2 completing)
    if err := workflow.ExecuteActivity(ctx, activities.ProcessThumbnailImages, videoID).Get(ctx, nil); err != nil {
        return err
    }

    // Step 5: Notify user their video is ready
    return workflow.ExecuteActivity(ctx, activities.NotifyUserVideoReady, videoID).Get(ctx, nil)
}
