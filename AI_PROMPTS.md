# AI Prompts & Problem-Solving Process

I didn't quite use AI to make architectural choices for me, rather asked it to execute my plans for me. Here are the major prompts: 

## 1. Design Token Extraction

**Approach:** Used the Sketch web viewer's "Export Design Tokens" feature to extract exact hex color values, typography specs, and shadow values. This provided the foundation for all CSS custom properties.

## 2. Timeline Date Positioning

**Challenge:** Converting date values to pixel positions across variable-width timelines.

**Solution:** Linear interpolation - calculate the ratio of (date - timelineStart) / (timelineEnd - timelineStart) and multiply by total timeline width in pixels. This approach works consistently across all zoom levels (day/week/month).

## 3. Overlap Detection Algorithm

**Challenge:** Efficiently detecting if a new/edited work order overlaps with existing orders on the same work center.

**Solution:** Two date ranges [s1, e1] and [s2, e2] overlap if and only if `s1 < e2 AND s2 < e1`. Filter existing orders by work center, exclude the order being edited (for edit mode), then check each remaining order against this condition.

## 4. Other prompts that I managed to make note of (kind of).

1. Create a pill component to be reused for status pills as well as 'current month'. Make it a presentation only component so the parent component can pass in styles. 
(I chose to have the parent component pass in styles as opposed to the parent component styling the pill from within its css). 
2. Separate the dropdown behavior into a component.
3. Breakdown timeline header and work order bar into separate components, with timeline component being the orchestrator. Keep the presentation components as dumb as you can. 
4. When a user hovers over an empty space on a table row, a hover button should show with a tooltip. 
5. Extract the said hover button UI into a separate component. Timescale component can orchestrate when it shows. 
6. work-order-service: don’t expose the behavior subjects directly, keep them private and expose via public functions as observables; and update usage
7. Add aria labels and add change detection push strategy to minimize refreshes.
8. Convert functions to pure functions when possible. Add public and private identifiers where appropriate.
9. Remove hover button specific code into a service, similarly with timeline state detemination as well.
10. Box shadows are scattered all over the place, please add variables for reuse.
11. Wire up the today button to bring today's timeline into view. The view should be centered based on the user's viewport as opposed to the table's width or column width.
