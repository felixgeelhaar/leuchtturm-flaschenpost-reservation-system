import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import ErrorMessage from "@/components/ErrorMessage.vue";

describe("ErrorMessage Component", () => {
  describe("Rendering", () => {
    it("should not render when no error is provided", () => {
      const wrapper = mount(ErrorMessage, {
        props: { error: "" },
      });

      expect(wrapper.find('[role="alert"]').exists()).toBe(false);
      expect(wrapper.html()).toBe("<!--v-if-->");
    });

    it("should not render when error is null", () => {
      const wrapper = mount(ErrorMessage, {
        props: { error: null },
      });

      expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    });

    it("should not render when error is undefined", () => {
      const wrapper = mount(ErrorMessage, {
        props: { error: undefined },
      });

      expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    });

    it("should render error message when error is provided", () => {
      const errorMessage = "This field is required";
      const wrapper = mount(ErrorMessage, {
        props: { error: errorMessage },
      });

      const errorElement = wrapper.find('[role="alert"]');
      expect(errorElement.exists()).toBe(true);
      expect(errorElement.isVisible()).toBe(true);
      expect(errorElement.text()).toContain(errorMessage);
    });

    it("should have correct CSS classes for styling", () => {
      const wrapper = mount(ErrorMessage, {
        props: { error: "Test error" },
      });

      const errorElement = wrapper.find('[role="alert"]');
      expect(errorElement.classes()).toContain("form-error");
      expect(errorElement.classes()).toContain("flex");
      expect(errorElement.classes()).toContain("items-start");
      expect(errorElement.classes()).toContain("space-x-2");
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes", () => {
      const wrapper = mount(ErrorMessage, {
        props: { error: "Validation error" },
      });

      const errorElement = wrapper.find('[role="alert"]');
      expect(errorElement.attributes("role")).toBe("alert");
      expect(errorElement.attributes("aria-live")).toBe("polite");
    });

    it("should be announced to screen readers", () => {
      const wrapper = mount(ErrorMessage, {
        props: { error: "Field validation failed" },
      });

      const errorElement = wrapper.find('[role="alert"]');
      expect(errorElement.attributes("aria-live")).toBe("polite");
    });
  });

  describe("Props", () => {
    it("should accept string error prop", () => {
      const errorMessage = "String error message";
      const wrapper = mount(ErrorMessage, {
        props: { error: errorMessage },
      });

      expect((wrapper.props() as any).error).toBe(errorMessage);
      expect(wrapper.text()).toContain(errorMessage);
    });

    it("should handle empty string gracefully", () => {
      const wrapper = mount(ErrorMessage, {
        props: { error: "" },
      });

      expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    });

    it("should handle whitespace-only strings", () => {
      const wrapper = mount(ErrorMessage, {
        props: { error: "   " },
      });

      // Whitespace-only strings should be treated as valid errors
      expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    });
  });

  describe("Reactivity", () => {
    it("should show error when prop changes from empty to error", async () => {
      const wrapper = mount(ErrorMessage, {
        props: { error: "" },
      });

      expect(wrapper.find('[role="alert"]').exists()).toBe(false);

      await wrapper.setProps({ error: "New error message" });

      const errorElement = wrapper.find('[role="alert"]');
      expect(errorElement.exists()).toBe(true);
      expect(errorElement.text()).toContain("New error message");
    });

    it("should hide error when prop changes from error to empty", async () => {
      const wrapper = mount(ErrorMessage, {
        props: { error: "Initial error" },
      });

      expect(wrapper.find('[role="alert"]').exists()).toBe(true);

      await wrapper.setProps({ error: "" });

      expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    });

    it("should update error message when prop changes", async () => {
      const wrapper = mount(ErrorMessage, {
        props: { error: "First error" },
      });

      expect(wrapper.text()).toContain("First error");

      await wrapper.setProps({ error: "Second error" });

      expect(wrapper.text()).toContain("Second error");
      expect(wrapper.text()).not.toContain("First error");
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long error messages", () => {
      const longError =
        "This is a very long error message that might cause layout issues if not handled properly. ".repeat(
          10,
        );
      const wrapper = mount(ErrorMessage, {
        props: { error: longError },
      });

      const errorElement = wrapper.find('[role="alert"]');
      expect(errorElement.exists()).toBe(true);
      expect(errorElement.text()).toContain(
        "This is a very long error message",
      );
    });

    it("should handle special characters in error messages", () => {
      const specialCharError = "Error with special chars: <>&\"'";
      const wrapper = mount(ErrorMessage, {
        props: { error: specialCharError },
      });

      const errorElement = wrapper.find('[role="alert"]');
      expect(errorElement.exists()).toBe(true);
      expect(errorElement.text()).toBe(specialCharError);
    });

    it("should handle HTML in error messages safely", () => {
      const htmlError = '<script>alert("xss")</script>Safe error message';
      const wrapper = mount(ErrorMessage, {
        props: { error: htmlError },
      });

      const errorElement = wrapper.find('[role="alert"]');
      expect(errorElement.exists()).toBe(true);
      // HTML should be escaped and displayed as text
      expect(errorElement.text()).toBe(htmlError);
      // The component actually renders the HTML safely in the text content
      expect(errorElement.find("span").text()).toBe(htmlError);
    });
  });

  describe("Performance", () => {
    it("should not cause unnecessary re-renders", async () => {
      const wrapper = mount(ErrorMessage, {
        props: { error: "Test error" },
      });

      const initialHtml = wrapper.html();

      // Setting the same error should not cause re-render
      await wrapper.setProps({ error: "Test error" });

      expect(wrapper.html()).toBe(initialHtml);
    });
  });
});
