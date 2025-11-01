import { APP_CHANNELS } from '../constants/app_channels';
import type { CardDraft, CardEntity } from '../../domain/card/card_entity';
import type { ReviewCandidate } from '../../domain/review/review_policy';
import type { MemoryLevel } from '../../domain/review/memory_level';
import type { ActivitySnapshot } from '../../domain/analytics/activity_snapshot';
export interface CardIngestRequest extends CardDraft {
  readonly card_id?: string;
}

export type CardIngestResponse = CardEntity;

export type CardListRequest = void;
export type CardListResponse = CardEntity[];

export interface ReviewQueueRequest {
  readonly size?: number;
}

export type ReviewQueueResponse = ReviewCandidate[];

export interface ReviewUpdateRequest {
  readonly card_id: string;
  readonly memory_level: MemoryLevel;
}

export type ReviewUpdateResponse = CardEntity;

export type AnalyticsSnapshotRequest = void;
export type AnalyticsSnapshotResponse = ActivitySnapshot;

export interface CardExportRequest {
  readonly format: 'json' | 'zip';
}

export interface CardExportResponse {
  readonly status: 'success' | 'cancelled' | 'error';
  readonly file_path?: string;
  readonly exported_cards?: number;
  readonly exported_sessions?: number;
  readonly message?: string;
}

export type CardImportRequest = void;

export interface CardImportResponse {
  readonly status: 'success' | 'cancelled' | 'error';
  readonly file_path?: string;
  readonly imported_cards?: number;
  readonly imported_sessions?: number;
  readonly message?: string;
}

export type RendererToMainContract = {
  [APP_CHANNELS.CARD_INGEST]: {
    readonly request: CardIngestRequest;
    readonly response: CardIngestResponse;
  };
  [APP_CHANNELS.CARD_LIST]: {
    readonly request: CardListRequest;
    readonly response: CardListResponse;
  };
  [APP_CHANNELS.REVIEW_QUEUE]: {
    readonly request: ReviewQueueRequest;
    readonly response: ReviewQueueResponse;
  };
  [APP_CHANNELS.REVIEW_UPDATE]: {
    readonly request: ReviewUpdateRequest;
    readonly response: ReviewUpdateResponse;
  };
  [APP_CHANNELS.ANALYTICS_SNAPSHOT]: {
    readonly request: AnalyticsSnapshotRequest;
    readonly response: AnalyticsSnapshotResponse;
  };
  [APP_CHANNELS.CARD_EXPORT]: {
    readonly request: CardExportRequest;
    readonly response: CardExportResponse;
  };
  [APP_CHANNELS.CARD_IMPORT]: {
    readonly request: CardImportRequest;
    readonly response: CardImportResponse;
  };
};

export type RendererToMainChannel = keyof RendererToMainContract;

export type RendererToMainRequest<TChannel extends RendererToMainChannel> =
  RendererToMainContract[TChannel]['request'];

export type RendererToMainResponse<TChannel extends RendererToMainChannel> =
  RendererToMainContract[TChannel]['response'];

export interface RendererApi {
  ingest_card(payload: CardIngestRequest): Promise<CardIngestResponse>;
  list_cards(): Promise<CardListResponse>;
  fetch_review_queue(request?: ReviewQueueRequest): Promise<ReviewQueueResponse>;
  update_review(payload: ReviewUpdateRequest): Promise<ReviewUpdateResponse>;
  fetch_analytics_snapshot(): Promise<AnalyticsSnapshotResponse>;
  export_cards(request: CardExportRequest): Promise<CardExportResponse>;
  import_cards(): Promise<CardImportResponse>;
}
