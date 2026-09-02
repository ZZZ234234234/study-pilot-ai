"use client";
import { useLocale } from "@/components/locale-provider";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  Circle,
  Files,
  LayoutDashboard,
  ListTree,
  Sparkles,
} from "lucide-react";
export function ProductPreview() {
  const { t } = useLocale();
  return (
    <div
      className="product-preview"
      aria-label={t("使用原创神经网络样例绘制的界面示意图")}
    >
      <div className="preview-toolbar">
        <span className="preview-dots">
          <i />
          <i />
          <i />
        </span>
        <span>{t("studypilot / 学习空间")}</span>
        <span className="preview-sample">{t("原创样例 · 界面示意")}</span>
      </div>
      <div className="preview-body">
        <aside className="preview-sidebar">
          <span className="mini-logo">
            S<span>StudyPilot</span>
          </span>
          <div>
            <LayoutDashboard size={14} />
            {t("学习概览")}
          </div>
          <div className="selected">
            <Files size={14} />
            {t("我的资料")}
          </div>
          <div>
            <ListTree size={14} />
            {t("复习计划")}
          </div>
          <span className="preview-bottom">{t("每天，都有一点进步。")}</span>
        </aside>
        <div className="preview-main">
          <div className="preview-breadcrumb">
            {t("我的资料")}
            <span>{t("/ 神经网络")}</span>
          </div>
          <h3>
            {t("走近")}
            <br />
            {t("神经网络")}
            <span className="preview-document-icon">
              <BookOpen size={27} />
            </span>
          </h3>
          <div className="preview-meta">
            <span>{t("8 页原文")}</span>
            <span>{t("16 个知识点")}</span>
            <span className="preview-ready">
              <Check size={11} />
              {t("开始学习")}
            </span>
          </div>
          <div className="preview-tabs">
            <span className="selected">{t("知识地图")}</span>
            <span>{t("文档问答")}</span>
            <span>{t("知识闪卡")}</span>
          </div>
          <div className="preview-topic">
            <span className="chapter-number">04</span>
            <div>
              <small>{t("第四章")}</small>
              <h4>{t("用卷积理解图像")}</h4>
            </div>
            <ArrowUpRight size={17} />
          </div>
          <div className="preview-knowledge">
            <span className="knowledge-node" />
            <div>
              <h4>{t("卷积为什么有用")}</h4>
              <p>
                {t("局部连接，权重共享。")}
                <br />
                {t("一个卷积核，识别不同位置的特征。")}
              </p>
              <span className="source-pill">{t("↗ 原文 · 第 4 页")}</span>
            </div>
          </div>
          <div className="preview-knowledge lower">
            <Circle size={10} />
            <div>
              <h4>{t("步幅、填充与池化")}</h4>
              <span className="mini-line" />
              <span className="mini-line short" />
            </div>
          </div>
        </div>
        <div className="preview-aside">
          <span className="assistant-label">
            <Sparkles size={14} />
            {t("你的学习伙伴")}
          </span>
          <div className="preview-question">
            {t("卷积为什么能")}
            <br />
            {t("减少参数数量？")}
          </div>
          <span className="answer-label">{t("回答依据来自原文")}</span>
          <p>
            {t("同一个小型卷积核会在图像各处重复使用。这种")}
            <strong>{t("权重共享")}</strong>{" "}
            {t("减少了网络所需的参数数量。（原文译意）")}
          </p>
          <div className="preview-citation">
            <BookOpen size={15} />
            <span>
              {t("神经网络")}
              <small>{t("第 4 页 · 原文出处")}</small>
            </span>
            <ArrowUpRight size={14} />
          </div>
          <div className="preview-input">
            {t("从一个问题，理解得更多。")}
            <span>↵</span>
          </div>
        </div>
      </div>
    </div>
  );
}
