import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * StudioSupportCopy — i18n surface for the studio dashboard's workspace-grade
 * support thread at /support/[threadId]. Covers the thread header (status
 * aria-labels, the staff actions menu: resolve/reopen, transfer division,
 * mute, flag, copy link/ID, download hint, transfer panel) plus the live
 * toast/feedback announcements, and the conversation room (composer
 * placeholder, empty state, closed/resolved hint notes).
 *
 * Pattern A typed-copy module: EN baseline is exhaustive; each authored locale
 * is a DeepPartial that deep-merges over EN so any missing key falls through
 * to EN silently. Division names stay as their canonical product labels.
 */
export type StudioSupportCopy = {
  header: {
    ariaLabel: string;
    statusAria: string;
    threadMeta: string;
    participantsAria: string;
    actionsLabel: string;
    transfer: {
      panelLabel: string;
      destinationAria: string;
      cancel: string;
    };
    actions: {
      reopen: {
        label: string;
        description: string;
      };
      resolve: {
        label: string;
        description: string;
      };
      transferDivision: {
        label: string;
        description: string;
      };
      unmute: {
        label: string;
        description: string;
      };
      mute: {
        label: string;
        description: string;
      };
      flag: {
        label: string;
        description: string;
      };
      copyLink: {
        label: string;
        confirmed: string;
      };
      copyId: {
        label: string;
        confirmed: string;
      };
      download: {
        label: string;
        description: string;
      };
    };
    foot: string;
    feedback: {
      notificationsMuted: string;
      notificationsOn: string;
      muteFailed: string;
      markedResolved: string;
      reopened: string;
      statusFailed: string;
      transferred: string;
      transferFailed: string;
      flagged: string;
      flagFailed: string;
    };
  };
  divisions: {
    studio: string;
    care: string;
    jobs: string;
    learn: string;
    property: string;
    logistics: string;
    marketplace: string;
    account: string;
    support: string;
  };
  room: {
    placeholder: string;
    emptyTitle: string;
    emptyBody: string;
    closedNote: string;
    resolvedNote: string;
  };
};

const EN: StudioSupportCopy = {
  header: {
    ariaLabel: "Support thread header",
    statusAria: "Status: {status}",
    threadMeta: "Thread #{id}",
    participantsAria: "Thread participants",
    actionsLabel: "Thread actions",
    transfer: {
      panelLabel: "Transfer to division",
      destinationAria: "Transfer destination",
      cancel: "Cancel",
    },
    actions: {
      reopen: {
        label: "Re-open thread",
        description: "Move back to the active queue and re-stamp updated_at.",
      },
      resolve: {
        label: "Mark resolved",
        description: "Flip status to resolved + post a system message.",
      },
      transferDivision: {
        label: "Transfer division",
        description: "Move to a different division's inbox.",
      },
      unmute: {
        label: "Unmute notifications",
        description: "Notifications paused for staff on this thread.",
      },
      mute: {
        label: "Mute notifications",
        description: "Pause inbox pings for this thread.",
      },
      flag: {
        label: "Flag for review",
        description: "Promote to high priority + audit log entry.",
      },
      copyLink: {
        label: "Copy thread link",
        confirmed: "Link copied",
      },
      copyId: {
        label: "Copy thread ID",
        confirmed: "ID copied",
      },
      download: {
        label: "Download (use the action above)",
        description: "Use the Download button to grab a branded PDF copy.",
      },
    },
    foot: "Thread · {subject}",
    feedback: {
      notificationsMuted: "Notifications muted",
      notificationsOn: "Notifications on",
      muteFailed: "Couldn't update mute. Try again.",
      markedResolved: "Thread marked resolved",
      reopened: "Thread re-opened",
      statusFailed: "Couldn't update status. Try again.",
      transferred: "Transferred to {division}",
      transferFailed: "Couldn't transfer. Try again.",
      flagged: "Flagged for ops review",
      flagFailed: "Couldn't flag for review. Try again.",
    },
  },
  divisions: {
    studio: "Studio",
    care: "Care",
    jobs: "Jobs",
    learn: "Learn",
    property: "Property",
    logistics: "Logistics",
    marketplace: "Marketplace",
    account: "Account",
    support: "Support (general)",
  },
  room: {
    placeholder:
      "Reply with the next action, clarification, or resolution. Drafts stay here while you type.",
    emptyTitle: "No replies yet",
    emptyBody:
      "The customer's message will appear here. Reply to start the conversation.",
    closedNote:
      "This thread is closed. The customer will need to open a new request to continue.",
    resolvedNote:
      "This thread is marked resolved. A reply here will re-open it for the customer.",
  },
};

const FR: DeepPartial<StudioSupportCopy> = {
  header: {
    ariaLabel: "En-tête du fil d'assistance",
    statusAria: "Statut : {status}",
    threadMeta: "Fil n° {id}",
    participantsAria: "Participants au fil",
    actionsLabel: "Actions du fil",
    transfer: {
      panelLabel: "Transférer vers une division",
      destinationAria: "Destination du transfert",
      cancel: "Annuler",
    },
    actions: {
      reopen: {
        label: "Rouvrir le fil",
        description:
          "Replacer dans la file active et réactualiser updated_at.",
      },
      resolve: {
        label: "Marquer comme résolu",
        description:
          "Passer le statut à résolu + publier un message système.",
      },
      transferDivision: {
        label: "Transférer la division",
        description: "Déplacer vers la boîte de réception d'une autre division.",
      },
      unmute: {
        label: "Réactiver les notifications",
        description: "Notifications suspendues pour le personnel sur ce fil.",
      },
      mute: {
        label: "Désactiver les notifications",
        description: "Suspendre les alertes de boîte de réception pour ce fil.",
      },
      flag: {
        label: "Signaler pour examen",
        description: "Passer en priorité élevée + entrée au journal d'audit.",
      },
      copyLink: {
        label: "Copier le lien du fil",
        confirmed: "Lien copié",
      },
      copyId: {
        label: "Copier l'ID du fil",
        confirmed: "ID copié",
      },
      download: {
        label: "Télécharger (utilisez l'action ci-dessus)",
        description:
          "Utilisez le bouton Télécharger pour obtenir une copie PDF de marque.",
      },
    },
    foot: "Fil · {subject}",
    feedback: {
      notificationsMuted: "Notifications désactivées",
      notificationsOn: "Notifications activées",
      muteFailed: "Impossible de modifier la sourdine. Réessayez.",
      markedResolved: "Fil marqué comme résolu",
      reopened: "Fil rouvert",
      statusFailed: "Impossible de mettre à jour le statut. Réessayez.",
      transferred: "Transféré vers {division}",
      transferFailed: "Impossible de transférer. Réessayez.",
      flagged: "Signalé pour examen des opérations",
      flagFailed: "Impossible de signaler pour examen. Réessayez.",
    },
  },
  divisions: {
    support: "Assistance (générale)",
  },
  room: {
    placeholder:
      "Répondez avec la prochaine action, une clarification ou une résolution. Les brouillons restent ici pendant que vous tapez.",
    emptyTitle: "Aucune réponse pour l'instant",
    emptyBody:
      "Le message du client apparaîtra ici. Répondez pour démarrer la conversation.",
    closedNote:
      "Ce fil est fermé. Le client devra ouvrir une nouvelle demande pour continuer.",
    resolvedNote:
      "Ce fil est marqué comme résolu. Une réponse ici le rouvrira pour le client.",
  },
};

const ES: DeepPartial<StudioSupportCopy> = {
  header: {
    ariaLabel: "Encabezado del hilo de soporte",
    statusAria: "Estado: {status}",
    threadMeta: "Hilo n.º {id}",
    participantsAria: "Participantes del hilo",
    actionsLabel: "Acciones del hilo",
    transfer: {
      panelLabel: "Transferir a una división",
      destinationAria: "Destino de la transferencia",
      cancel: "Cancelar",
    },
    actions: {
      reopen: {
        label: "Reabrir el hilo",
        description: "Volver a la cola activa y volver a sellar updated_at.",
      },
      resolve: {
        label: "Marcar como resuelto",
        description:
          "Cambiar el estado a resuelto + publicar un mensaje del sistema.",
      },
      transferDivision: {
        label: "Transferir división",
        description: "Mover a la bandeja de entrada de otra división.",
      },
      unmute: {
        label: "Reactivar notificaciones",
        description: "Notificaciones en pausa para el personal en este hilo.",
      },
      mute: {
        label: "Silenciar notificaciones",
        description: "Pausar los avisos de la bandeja de entrada para este hilo.",
      },
      flag: {
        label: "Marcar para revisión",
        description: "Subir a prioridad alta + entrada en el registro de auditoría.",
      },
      copyLink: {
        label: "Copiar enlace del hilo",
        confirmed: "Enlace copiado",
      },
      copyId: {
        label: "Copiar ID del hilo",
        confirmed: "ID copiado",
      },
      download: {
        label: "Descargar (use la acción de arriba)",
        description:
          "Use el botón Descargar para obtener una copia PDF con la marca.",
      },
    },
    foot: "Hilo · {subject}",
    feedback: {
      notificationsMuted: "Notificaciones silenciadas",
      notificationsOn: "Notificaciones activadas",
      muteFailed: "No se pudo actualizar el silencio. Inténtalo de nuevo.",
      markedResolved: "Hilo marcado como resuelto",
      reopened: "Hilo reabierto",
      statusFailed: "No se pudo actualizar el estado. Inténtalo de nuevo.",
      transferred: "Transferido a {division}",
      transferFailed: "No se pudo transferir. Inténtalo de nuevo.",
      flagged: "Marcado para revisión de operaciones",
      flagFailed: "No se pudo marcar para revisión. Inténtalo de nuevo.",
    },
  },
  divisions: {
    support: "Soporte (general)",
  },
  room: {
    placeholder:
      "Responde con la siguiente acción, aclaración o resolución. Los borradores se quedan aquí mientras escribes.",
    emptyTitle: "Aún no hay respuestas",
    emptyBody:
      "El mensaje del cliente aparecerá aquí. Responde para iniciar la conversación.",
    closedNote:
      "Este hilo está cerrado. El cliente deberá abrir una nueva solicitud para continuar.",
    resolvedNote:
      "Este hilo está marcado como resuelto. Una respuesta aquí lo reabrirá para el cliente.",
  },
};

const PT: DeepPartial<StudioSupportCopy> = {
  header: {
    ariaLabel: "Cabeçalho do tópico de suporte",
    statusAria: "Status: {status}",
    threadMeta: "Tópico n.º {id}",
    participantsAria: "Participantes do tópico",
    actionsLabel: "Ações do tópico",
    transfer: {
      panelLabel: "Transferir para uma divisão",
      destinationAria: "Destino da transferência",
      cancel: "Cancelar",
    },
    actions: {
      reopen: {
        label: "Reabrir tópico",
        description: "Voltar para a fila ativa e recarimbar updated_at.",
      },
      resolve: {
        label: "Marcar como resolvido",
        description:
          "Alterar o status para resolvido + publicar uma mensagem do sistema.",
      },
      transferDivision: {
        label: "Transferir divisão",
        description: "Mover para a caixa de entrada de outra divisão.",
      },
      unmute: {
        label: "Reativar notificações",
        description: "Notificações pausadas para a equipe neste tópico.",
      },
      mute: {
        label: "Silenciar notificações",
        description: "Pausar os avisos da caixa de entrada para este tópico.",
      },
      flag: {
        label: "Sinalizar para revisão",
        description: "Elevar para prioridade alta + entrada no log de auditoria.",
      },
      copyLink: {
        label: "Copiar link do tópico",
        confirmed: "Link copiado",
      },
      copyId: {
        label: "Copiar ID do tópico",
        confirmed: "ID copiado",
      },
      download: {
        label: "Baixar (use a ação acima)",
        description:
          "Use o botão Baixar para obter uma cópia em PDF com a marca.",
      },
    },
    foot: "Tópico · {subject}",
    feedback: {
      notificationsMuted: "Notificações silenciadas",
      notificationsOn: "Notificações ativadas",
      muteFailed: "Não foi possível atualizar o silenciamento. Tente novamente.",
      markedResolved: "Tópico marcado como resolvido",
      reopened: "Tópico reaberto",
      statusFailed: "Não foi possível atualizar o status. Tente novamente.",
      transferred: "Transferido para {division}",
      transferFailed: "Não foi possível transferir. Tente novamente.",
      flagged: "Sinalizado para revisão de operações",
      flagFailed: "Não foi possível sinalizar para revisão. Tente novamente.",
    },
  },
  divisions: {
    support: "Suporte (geral)",
  },
  room: {
    placeholder:
      "Responda com a próxima ação, esclarecimento ou resolução. Os rascunhos ficam aqui enquanto você digita.",
    emptyTitle: "Ainda sem respostas",
    emptyBody:
      "A mensagem do cliente aparecerá aqui. Responda para iniciar a conversa.",
    closedNote:
      "Este tópico está fechado. O cliente precisará abrir uma nova solicitação para continuar.",
    resolvedNote:
      "Este tópico está marcado como resolvido. Uma resposta aqui irá reabri-lo para o cliente.",
  },
};

const AR: DeepPartial<StudioSupportCopy> = {
  header: {
    ariaLabel: "ترويسة محادثة الدعم",
    statusAria: "الحالة: {status}",
    threadMeta: "المحادثة رقم {id}",
    participantsAria: "المشاركون في المحادثة",
    actionsLabel: "إجراءات المحادثة",
    transfer: {
      panelLabel: "التحويل إلى قسم",
      destinationAria: "وجهة التحويل",
      cancel: "إلغاء",
    },
    actions: {
      reopen: {
        label: "إعادة فتح المحادثة",
        description: "إعادتها إلى قائمة الانتظار النشطة وتحديث updated_at.",
      },
      resolve: {
        label: "وضع علامة كمحلولة",
        description: "تغيير الحالة إلى محلولة + نشر رسالة نظام.",
      },
      transferDivision: {
        label: "تحويل القسم",
        description: "النقل إلى صندوق وارد قسم آخر.",
      },
      unmute: {
        label: "إعادة تفعيل الإشعارات",
        description: "الإشعارات موقوفة للموظفين في هذه المحادثة.",
      },
      mute: {
        label: "كتم الإشعارات",
        description: "إيقاف تنبيهات صندوق الوارد لهذه المحادثة مؤقتًا.",
      },
      flag: {
        label: "الإبلاغ للمراجعة",
        description: "الترقية إلى أولوية عالية + إدخال في سجل التدقيق.",
      },
      copyLink: {
        label: "نسخ رابط المحادثة",
        confirmed: "تم نسخ الرابط",
      },
      copyId: {
        label: "نسخ معرّف المحادثة",
        confirmed: "تم نسخ المعرّف",
      },
      download: {
        label: "تنزيل (استخدم الإجراء أعلاه)",
        description: "استخدم زر التنزيل للحصول على نسخة PDF تحمل العلامة التجارية.",
      },
    },
    foot: "المحادثة · {subject}",
    feedback: {
      notificationsMuted: "تم كتم الإشعارات",
      notificationsOn: "الإشعارات مفعّلة",
      muteFailed: "تعذّر تحديث الكتم. حاول مرة أخرى.",
      markedResolved: "تم وضع علامة على المحادثة كمحلولة",
      reopened: "تمت إعادة فتح المحادثة",
      statusFailed: "تعذّر تحديث الحالة. حاول مرة أخرى.",
      transferred: "تم التحويل إلى {division}",
      transferFailed: "تعذّر التحويل. حاول مرة أخرى.",
      flagged: "تم الإبلاغ لمراجعة العمليات",
      flagFailed: "تعذّر الإبلاغ للمراجعة. حاول مرة أخرى.",
    },
  },
  divisions: {
    support: "الدعم (عام)",
  },
  room: {
    placeholder:
      "أجب بالإجراء التالي أو التوضيح أو الحل. تبقى المسودات هنا أثناء الكتابة.",
    emptyTitle: "لا توجد ردود بعد",
    emptyBody: "ستظهر رسالة العميل هنا. أجب لبدء المحادثة.",
    closedNote:
      "هذه المحادثة مغلقة. سيحتاج العميل إلى فتح طلب جديد للمتابعة.",
    resolvedNote:
      "تم وضع علامة على هذه المحادثة كمحلولة. أي رد هنا سيعيد فتحها للعميل.",
  },
};

const DE: DeepPartial<StudioSupportCopy> = {
  header: {
    ariaLabel: "Kopfzeile des Support-Threads",
    statusAria: "Status: {status}",
    threadMeta: "Thread Nr. {id}",
    participantsAria: "Thread-Teilnehmer",
    actionsLabel: "Thread-Aktionen",
    transfer: {
      panelLabel: "An eine Abteilung übertragen",
      destinationAria: "Übertragungsziel",
      cancel: "Abbrechen",
    },
    actions: {
      reopen: {
        label: "Thread erneut öffnen",
        description:
          "Zurück in die aktive Warteschlange verschieben und updated_at neu stempeln.",
      },
      resolve: {
        label: "Als gelöst markieren",
        description:
          "Status auf gelöst setzen + eine Systemnachricht posten.",
      },
      transferDivision: {
        label: "Abteilung übertragen",
        description: "In den Posteingang einer anderen Abteilung verschieben.",
      },
      unmute: {
        label: "Benachrichtigungen aktivieren",
        description:
          "Benachrichtigungen für Mitarbeiter in diesem Thread pausiert.",
      },
      mute: {
        label: "Benachrichtigungen stummschalten",
        description: "Posteingang-Hinweise für diesen Thread pausieren.",
      },
      flag: {
        label: "Zur Prüfung melden",
        description: "Auf hohe Priorität heraufstufen + Audit-Log-Eintrag.",
      },
      copyLink: {
        label: "Thread-Link kopieren",
        confirmed: "Link kopiert",
      },
      copyId: {
        label: "Thread-ID kopieren",
        confirmed: "ID kopiert",
      },
      download: {
        label: "Herunterladen (Aktion oben verwenden)",
        description:
          "Verwenden Sie die Schaltfläche „Herunterladen“ für eine gebrandete PDF-Kopie.",
      },
    },
    foot: "Thread · {subject}",
    feedback: {
      notificationsMuted: "Benachrichtigungen stummgeschaltet",
      notificationsOn: "Benachrichtigungen aktiviert",
      muteFailed: "Stummschaltung konnte nicht aktualisiert werden. Erneut versuchen.",
      markedResolved: "Thread als gelöst markiert",
      reopened: "Thread erneut geöffnet",
      statusFailed: "Status konnte nicht aktualisiert werden. Erneut versuchen.",
      transferred: "An {division} übertragen",
      transferFailed: "Übertragung fehlgeschlagen. Erneut versuchen.",
      flagged: "Zur Ops-Prüfung gemeldet",
      flagFailed: "Meldung zur Prüfung fehlgeschlagen. Erneut versuchen.",
    },
  },
  divisions: {
    support: "Support (allgemein)",
  },
  room: {
    placeholder:
      "Antworten Sie mit der nächsten Aktion, Klarstellung oder Lösung. Entwürfe bleiben hier, während Sie tippen.",
    emptyTitle: "Noch keine Antworten",
    emptyBody:
      "Die Nachricht des Kunden erscheint hier. Antworten Sie, um das Gespräch zu beginnen.",
    closedNote:
      "Dieser Thread ist geschlossen. Der Kunde muss eine neue Anfrage öffnen, um fortzufahren.",
    resolvedNote:
      "Dieser Thread ist als gelöst markiert. Eine Antwort hier öffnet ihn für den Kunden erneut.",
  },
};

const IT: DeepPartial<StudioSupportCopy> = {
  header: {
    ariaLabel: "Intestazione del thread di assistenza",
    statusAria: "Stato: {status}",
    threadMeta: "Thread n. {id}",
    participantsAria: "Partecipanti al thread",
    actionsLabel: "Azioni del thread",
    transfer: {
      panelLabel: "Trasferisci a una divisione",
      destinationAria: "Destinazione del trasferimento",
      cancel: "Annulla",
    },
    actions: {
      reopen: {
        label: "Riapri il thread",
        description:
          "Riporta alla coda attiva e ritimbra updated_at.",
      },
      resolve: {
        label: "Segna come risolto",
        description:
          "Cambia lo stato in risolto + pubblica un messaggio di sistema.",
      },
      transferDivision: {
        label: "Trasferisci divisione",
        description: "Sposta nella casella di posta di un'altra divisione.",
      },
      unmute: {
        label: "Riattiva le notifiche",
        description: "Notifiche in pausa per lo staff su questo thread.",
      },
      mute: {
        label: "Silenzia le notifiche",
        description: "Metti in pausa gli avvisi della posta in arrivo per questo thread.",
      },
      flag: {
        label: "Segnala per revisione",
        description: "Eleva a priorità alta + voce nel registro di audit.",
      },
      copyLink: {
        label: "Copia il link del thread",
        confirmed: "Link copiato",
      },
      copyId: {
        label: "Copia l'ID del thread",
        confirmed: "ID copiato",
      },
      download: {
        label: "Scarica (usa l'azione sopra)",
        description:
          "Usa il pulsante Scarica per ottenere una copia PDF con il marchio.",
      },
    },
    foot: "Thread · {subject}",
    feedback: {
      notificationsMuted: "Notifiche silenziate",
      notificationsOn: "Notifiche attivate",
      muteFailed: "Impossibile aggiornare il silenziamento. Riprova.",
      markedResolved: "Thread segnato come risolto",
      reopened: "Thread riaperto",
      statusFailed: "Impossibile aggiornare lo stato. Riprova.",
      transferred: "Trasferito a {division}",
      transferFailed: "Impossibile trasferire. Riprova.",
      flagged: "Segnalato per la revisione delle operazioni",
      flagFailed: "Impossibile segnalare per la revisione. Riprova.",
    },
  },
  divisions: {
    support: "Assistenza (generale)",
  },
  room: {
    placeholder:
      "Rispondi con la prossima azione, un chiarimento o una risoluzione. Le bozze restano qui mentre digiti.",
    emptyTitle: "Ancora nessuna risposta",
    emptyBody:
      "Il messaggio del cliente apparirà qui. Rispondi per iniziare la conversazione.",
    closedNote:
      "Questo thread è chiuso. Il cliente dovrà aprire una nuova richiesta per continuare.",
    resolvedNote:
      "Questo thread è segnato come risolto. Una risposta qui lo riaprirà per il cliente.",
  },
};

const ZH: DeepPartial<StudioSupportCopy> = {
  header: {
    ariaLabel: "支持会话标题",
    statusAria: "状态：{status}",
    threadMeta: "会话 #{id}",
    participantsAria: "会话参与者",
    actionsLabel: "会话操作",
    transfer: {
      panelLabel: "转移到部门",
      destinationAria: "转移目标",
      cancel: "取消",
    },
    actions: {
      reopen: {
        label: "重新打开会话",
        description: "移回活动队列并重新标记 updated_at。",
      },
      resolve: {
        label: "标记为已解决",
        description: "将状态切换为已解决 + 发布一条系统消息。",
      },
      transferDivision: {
        label: "转移部门",
        description: "移至其他部门的收件箱。",
      },
      unmute: {
        label: "取消静音通知",
        description: "此会话已为员工暂停通知。",
      },
      mute: {
        label: "静音通知",
        description: "暂停此会话的收件箱提醒。",
      },
      flag: {
        label: "标记以供审核",
        description: "提升为高优先级 + 审计日志条目。",
      },
      copyLink: {
        label: "复制会话链接",
        confirmed: "链接已复制",
      },
      copyId: {
        label: "复制会话 ID",
        confirmed: "ID 已复制",
      },
      download: {
        label: "下载（请使用上方操作）",
        description: "使用下载按钮获取带品牌的 PDF 副本。",
      },
    },
    foot: "会话 · {subject}",
    feedback: {
      notificationsMuted: "通知已静音",
      notificationsOn: "通知已开启",
      muteFailed: "无法更新静音设置。请重试。",
      markedResolved: "会话已标记为已解决",
      reopened: "会话已重新打开",
      statusFailed: "无法更新状态。请重试。",
      transferred: "已转移至 {division}",
      transferFailed: "无法转移。请重试。",
      flagged: "已标记以供运营审核",
      flagFailed: "无法标记以供审核。请重试。",
    },
  },
  divisions: {
    support: "支持（综合）",
  },
  room: {
    placeholder: "回复下一步操作、澄清说明或解决方案。草稿会在您输入时保留在此处。",
    emptyTitle: "暂无回复",
    emptyBody: "客户的消息将显示在此处。回复以开始对话。",
    closedNote: "此会话已关闭。客户需要开启新的请求才能继续。",
    resolvedNote: "此会话已标记为已解决。在此回复将为客户重新打开会话。",
  },
};

const LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<StudioSupportCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  ar: AR,
  de: DE,
  it: IT,
  zh: ZH,
};
// ig, yo, ha, hi are intentionally OMITTED -> fall back to EN (human-translation only).

export function getStudioSupportCopy(locale: AppLocale): StudioSupportCopy {
  const o = LOCALE_MAP[locale];
  if (o)
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      o as unknown as Record<string, unknown>,
    ) as unknown as StudioSupportCopy;
  return EN;
}
