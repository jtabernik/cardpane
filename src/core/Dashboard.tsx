import React, { useMemo, useState, useEffect, useRef } from 'react';
import RGL from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import type { Widget, DashboardLayout } from './types';
import { WidgetWrapper } from './WidgetWrapper';
import '../styles/theme.css';

// We use the static GridLayout to ensure positions are "sacred" and never reflow.
const ReactGridLayout = RGL;

interface DashboardProps {
    widgets: Widget[];
    layout: DashboardLayout;
    onLayoutChange?: (layout: DashboardLayout) => void;
    onEditWidget?: (instanceId: string) => void;
    isEditable?: boolean;
}

const COLUMN_WIDTH = 200;
const ROW_HEIGHT = 100;
const MARGIN: [number, number] = [15, 15];
const MIN_STATIC_COLS = 6; // Minimum columns to show even if empty

export const Dashboard: React.FC<DashboardProps> = ({
    widgets,
    layout,
    onLayoutChange,
    onEditWidget,
    isEditable = true
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(1200);

    // Track container width to determine if we can add more columns on the right
    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.contentRect) {
                    setContainerWidth(entry.contentRect.width);
                }
            }
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Calculate current content width in columns
    const contentMaxX = useMemo(() => {
        if (layout.length === 0) return 0;
        return Math.max(...layout.map(item => item.x + item.w));
    }, [layout]);

    // Calculate how many columns fit in the current window
    const fitCols = Math.floor((containerWidth - MARGIN[0]) / (COLUMN_WIDTH + MARGIN[0]));

    // The grid should never be narrower than the content itself
    const numCols = Math.max(MIN_STATIC_COLS, contentMaxX, fitCols);
    const gridWidth = numCols * COLUMN_WIDTH + (numCols + 1) * MARGIN[0];

    const gridLayout = useMemo(() => {
        return layout.map(item => ({
            i: item.i,
            x: item.x,
            y: item.y,
            w: item.w,
            h: item.h,
        }));
    }, [layout]);

    const widgetMap = useMemo(() => {
        return widgets.reduce((acc, w) => {
            acc[w.id] = w;
            return acc;
        }, {} as Record<string, Widget>);
    }, [widgets]);

    const handleLayoutChange = (currentLayout: any[]) => {
        if (onLayoutChange) {
            const newLayout: DashboardLayout = currentLayout.map(l => {
                const original = layout.find(item => item.i === l.i);
                const widgetDef = widgetMap[original?.widgetId || ''];

                // Validate size against supportedSizes if defined
                let finalW = l.w;
                let finalH = l.h;

                if (widgetDef?.supportedSizes && widgetDef.supportedSizes.length > 0) {
                    // Find closest supported size
                    const supported = widgetDef.supportedSizes.find(
                        s => s.w === l.w && s.h === l.h
                    );

                    if (!supported) {
                        // Revert to default size if not supported
                        finalW = widgetDef.defaultSize.w;
                        finalH = widgetDef.defaultSize.h;
                    }
                }

                return {
                    ...original!,
                    widgetId: original?.widgetId || 'unknown',
                    x: l.x,
                    y: l.y,
                    w: finalW,
                    h: finalH
                };
            });
            onLayoutChange(newLayout);
        }
    };

    return (
        <div className="dashboard-container" ref={containerRef}>
            <div className="grid-scroll-wrapper">
                <div className="grid-centering-wrapper" style={{ width: gridWidth }}>
                    <ReactGridLayout
                        className="layout"
                        layout={gridLayout}
                        cols={numCols}
                        rowHeight={ROW_HEIGHT}
                        margin={MARGIN}
                        width={gridWidth}
                        onDragStop={(layout: any) => handleLayoutChange(layout)}
                        onResizeStop={(layout: any) => handleLayoutChange(layout)}
                        isDraggable={isEditable}
                        isResizable={isEditable}
                        draggableHandle=".widget-wrapper"
                    >
                        {layout.map((item) => {
                            const widgetDef = widgetMap[item.widgetId];
                            if (!widgetDef) return <div key={item.i}>Unknown Widget</div>;
                            const Component = widgetDef.component;
                            return (
                                <WidgetWrapper
                                    key={item.i}
                                    hasConfig={widgetDef.configSchema && Object.keys(widgetDef.configSchema).length > 0}
                                    onEdit={onEditWidget ? () => onEditWidget(item.i) : undefined}
                                >
                                    <Component
                                        id={item.i}
                                        size={{ w: item.w, h: item.h }}
                                        config={item.config}
                                    />
                                </WidgetWrapper>
                            );
                        })}
                    </ReactGridLayout>
                </div>
            </div>

            <style>{`
        .dashboard-container {
            padding: 20px;
            min-height: 100vh;
            width: 100%;
            box-sizing: border-box;
            background: var(--dashboard-bg);
            overflow-x: auto;
        }
        .grid-scroll-wrapper {
            min-width: 100%;
            display: flex;
        }
        .grid-centering-wrapper {
            flex-shrink: 0;
            transition: width 0.2s ease-out;
        }
      `}</style>
        </div>
    );
};
