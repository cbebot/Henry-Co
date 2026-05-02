"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AttachmentUploader,
  ComposerAttachment,
  RemoteAttachment,
} from "../types";
import {
  classifyAttachment,
  formatMb,
  nextAttachmentId,
  validateFile,
} from "../util/validateAttachment";

export type AttachmentUploadOptions = {
  uploader?: AttachmentUploader;
  maxBytes: number;
  maxAttachments: number;
  acceptedMimeTypes: readonly string[];
  onValidationError?: (message: string) => void;
};

export type UseAttachmentUploadResult = {
  attachments: ComposerAttachment[];
  addFiles: (files: FileList | File[]) => void;
  removeAttachment: (id: string) => void;
  retryAttachment: (id: string) => void;
  clearAll: () => void;
  hasPending: boolean;
  hasFailed: boolean;
  totalSizeLabel: string;
  setRemote: (id: string, remote: RemoteAttachment) => void;
};

export function useAttachmentUpload(
  options: AttachmentUploadOptions
): UseAttachmentUploadResult {
  const {
    uploader,
    maxBytes,
    maxAttachments,
    acceptedMimeTypes,
    onValidationError,
  } = options;

  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
  const abortControllers = useRef<Map<string, AbortController>>(new Map());
  const previewUrls = useRef<Set<string>>(new Set());
  const attachmentsCountSnapshot = useRef(0);

  const releasePreview = useCallback((url?: string) => {
    if (!url) return;
    if (previewUrls.current.has(url)) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
      previewUrls.current.delete(url);
    }
  }, []);

  useEffect(() => {
    return () => {
      abortControllers.current.forEach((c) => c.abort());
      previewUrls.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      });
      previewUrls.current.clear();
    };
  }, []);

  const buildAttachment = useCallback(
    (file: File): ComposerAttachment => {
      const kind = classifyAttachment(file);
      let previewUrl: string | undefined;
      if (kind === "image" && typeof URL !== "undefined") {
        try {
          previewUrl = URL.createObjectURL(file);
          previewUrls.current.add(previewUrl);
        } catch {
          previewUrl = undefined;
        }
      }
      return {
        id: nextAttachmentId(),
        file,
        name: file.name,
        size: file.size,
        mimeType: file.type || "application/octet-stream",
        kind,
        previewUrl,
        status: uploader ? "pending" : "uploaded",
        progress: uploader ? 0 : 100,
      };
    },
    [uploader]
  );

  const startUpload = useCallback(
    async (attachmentId: string, file: File) => {
      if (!uploader) return;
      const controller = new AbortController();
      abortControllers.current.set(attachmentId, controller);

      setAttachments((current) =>
        current.map((att) =>
          att.id === attachmentId
            ? { ...att, status: "uploading", progress: 0, error: undefined }
            : att
        )
      );

      const handleProgress = (percent: number) => {
        setAttachments((current) =>
          current.map((att) =>
            att.id === attachmentId
              ? { ...att, progress: Math.max(att.progress, percent) }
              : att
          )
        );
      };

      try {
        const remote = await uploader(file, handleProgress, controller.signal);
        setAttachments((current) =>
          current.map((att) =>
            att.id === attachmentId
              ? { ...att, status: "uploaded", progress: 100, remote }
              : att
          )
        );
      } catch (error) {
        if (controller.signal.aborted) return;
        const msg =
          error instanceof Error ? error.message : "Upload failed";
        setAttachments((current) =>
          current.map((att) =>
            att.id === attachmentId
              ? { ...att, status: "failed", error: msg }
              : att
          )
        );
      } finally {
        abortControllers.current.delete(attachmentId);
      }
    },
    [uploader]
  );

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const list = Array.from(incoming);
      if (list.length === 0) return;

      let workingCount = attachmentsCountSnapshot.current;
      const accepted: ComposerAttachment[] = [];

      for (const file of list) {
        if (workingCount >= maxAttachments) {
          onValidationError?.(
            `You can attach up to ${maxAttachments} files per message.`
          );
          break;
        }
        const validation = validateFile(file, {
          maxBytes,
          acceptedMimeTypes,
        });
        if (!validation.ok) {
          onValidationError?.(validation.message);
          continue;
        }
        const att = buildAttachment(file);
        accepted.push(att);
        workingCount += 1;
      }

      if (accepted.length === 0) return;

      setAttachments((current) => {
        const next = [...current, ...accepted];
        attachmentsCountSnapshot.current = next.length;
        return next;
      });

      if (uploader) {
        for (const att of accepted) {
          void startUpload(att.id, att.file);
        }
      }
    },
    [
      buildAttachment,
      maxAttachments,
      maxBytes,
      acceptedMimeTypes,
      onValidationError,
      uploader,
      startUpload,
    ]
  );

  useEffect(() => {
    attachmentsCountSnapshot.current = attachments.length;
  }, [attachments.length]);

  const removeAttachment = useCallback(
    (id: string) => {
      const controller = abortControllers.current.get(id);
      if (controller) {
        controller.abort();
        abortControllers.current.delete(id);
      }
      setAttachments((current) => {
        const target = current.find((att) => att.id === id);
        releasePreview(target?.previewUrl);
        const next = current.filter((att) => att.id !== id);
        attachmentsCountSnapshot.current = next.length;
        return next;
      });
    },
    [releasePreview]
  );

  const retryAttachment = useCallback(
    (id: string) => {
      const target = attachments.find((att) => att.id === id);
      if (!target) return;
      void startUpload(id, target.file);
    },
    [attachments, startUpload]
  );

  const clearAll = useCallback(() => {
    abortControllers.current.forEach((c) => c.abort());
    abortControllers.current.clear();
    setAttachments((current) => {
      current.forEach((att) => releasePreview(att.previewUrl));
      attachmentsCountSnapshot.current = 0;
      return [];
    });
  }, [releasePreview]);

  const setRemote = useCallback((id: string, remote: RemoteAttachment) => {
    setAttachments((current) =>
      current.map((att) =>
        att.id === id
          ? { ...att, remote, status: "uploaded", progress: 100 }
          : att
      )
    );
  }, []);

  const hasPending = attachments.some(
    (att) => att.status === "pending" || att.status === "uploading"
  );
  const hasFailed = attachments.some((att) => att.status === "failed");
  const totalBytes = attachments.reduce((acc, att) => acc + att.size, 0);
  const totalSizeLabel = totalBytes > 0 ? formatMb(totalBytes) : "";

  return {
    attachments,
    addFiles,
    removeAttachment,
    retryAttachment,
    clearAll,
    hasPending,
    hasFailed,
    totalSizeLabel,
    setRemote,
  };
}
